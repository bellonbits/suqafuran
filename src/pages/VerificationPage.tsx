import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../layouts/DashboardLayout';
import api, { API_BASE_URL } from '../services/api';
import {
    ShieldCheck, Upload, FileText, CheckCircle,
    AlertCircle, Loader2, ChevronRight, Info, TrendingUp
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';

const VerificationPage: React.FC = () => {
    const API_HOST = API_BASE_URL.replace('/api/v1', '');
    const [step, setStep] = useState(1);
    const [docType, setDocType] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const { data: status } = useQuery({
        queryKey: ['verification-status'],
        queryFn: () => api.get('/verifications/me').then((res: any) => res.data),
    });

    const submitMutation = useMutation({
        mutationFn: (data: any) => api.post('/verifications/apply', data),
        onSuccess: () => setStep(3),
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);

        // Mocking upload for now - in real app, call listingService.uploadImage
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const res = await api.post('/listings/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFiles([...files, res.data.url]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = () => {
        submitMutation.mutate({
            document_type: docType,
            document_urls: files,
        });
    };

    if (status?.status === 'pending') {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto text-center py-20">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Under Review</h1>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        Our moderation team is currently reviewing your documents.
                        This usually takes **24-48 hours**. We'll notify you as soon as your status changes.
                    </p>
                    <Button variant="outline" className="mt-10 rounded-xl" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-gray-900">Get Verified</h1>
                <p className="text-sm text-gray-500 mt-1">Build trust and boost your sales by becoming a verified seller.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Progress Bar */}
                        <div className="flex border-b border-gray-50">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "flex-1 h-2 transition-colors",
                                        step >= s ? "bg-primary-600" : "bg-gray-100"
                                    )}
                                />
                            ))}
                        </div>

                        <div className="p-8 md:p-12">
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Choose Document Type</h2>
                                        <p className="text-gray-500">Please select the type of identification you wish to provide.</p>
                                    </div>

                                    <div className="grid gap-4">
                                        {[
                                            { id: 'id', label: 'National ID Card', desc: 'Front and back side' },
                                            { id: 'passport', label: 'Passport', desc: 'Main bio page' },
                                            { id: 'business', label: 'Business Registration', desc: 'Certificate of incorporation' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setDocType(opt.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left group",
                                                    docType === opt.id
                                                        ? "border-primary-600 bg-primary-50/30 shadow-md"
                                                        : "border-gray-100 hover:border-primary-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                                        docType === opt.id ? "bg-primary-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600"
                                                    )}>
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{opt.label}</p>
                                                        <p className="text-xs text-gray-500">{opt.desc}</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                    docType === opt.id ? "border-primary-600 bg-primary-600" : "border-gray-200"
                                                )}>
                                                    {docType === opt.id && <CheckCircle className="h-4 w-4 text-white" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-gray-50">
                                        <Button
                                            className="w-full h-14 rounded-2xl text-lg font-bold gap-2"
                                            disabled={!docType}
                                            onClick={() => setStep(2)}
                                        >
                                            Next Step
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Upload Documents</h2>
                                        <p className="text-gray-500">Upload clear photos of your {docType.toUpperCase()}. Max 5MB per file.</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {files.map((url, i) => (
                                            <div key={i} className="aspect-video relative rounded-2xl overflow-hidden border border-gray-100 group">
                                                <img src={`${API_HOST}${url}`} alt="Upload" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {files.length < 2 && (
                                            <label className="aspect-video rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50/20 cursor-pointer flex flex-col items-center justify-center transition-all group">
                                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                                    {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">Click to Upload</p>
                                                <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">JPEG, PNG or PDF</p>
                                            </label>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t border-gray-50">
                                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setStep(1)}>Back</Button>
                                        <Button
                                            className="flex-[2] h-14 rounded-2xl text-lg font-bold"
                                            disabled={files.length === 0 || isUploading || submitMutation.isPending}
                                            onClick={handleSubmit}
                                        >
                                            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Submit for Review'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                        <CheckCircle className="h-10 w-10" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
                                    <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
                                        Thank you for submitting your documents. We've received your request and will review it shortly.
                                    </p>
                                    <Button className="mt-10 rounded-xl px-12 h-12" onClick={() => window.history.back()}>
                                        Return to Dashboard
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-primary-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <ShieldCheck className="h-24 w-24 absolute -bottom-4 -right-4 opacity-10" />
                        <h4 className="text-xl font-bold mb-4">Why get verified?</h4>
                        <ul className="space-y-4">
                            {[
                                { icon: ShieldCheck, text: 'Verification Badge on profile' },
                                { icon: TrendingUp, text: 'Higher ranking in search' },
                                { icon: Info, text: 'Increase buyer confidence' }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-primary-50">
                                    <item.icon className="h-5 w-5 text-secondary-400" />
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export { VerificationPage };
