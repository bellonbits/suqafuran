import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Camera, Upload, CheckCircle, XCircle, Shield, Loader2,
    AlertCircle, RefreshCw, Image as ImageIcon, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';

const DOCUMENT_TYPES = [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'refugee_id', label: 'Refugee ID' },
];

const VerificationPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [selfieMode, setSelfieMode] = useState<'webcam' | 'upload'>('upload');
    const [selfieCapture, setSelfieCapture] = useState<string | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const [documentType, setDocumentType] = useState('national_id');
    const [webcamError, setWebcamError] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    const { data: status, isLoading } = useQuery({
        queryKey: ['verification-status'],
        queryFn: () => api.get('/verifications/me').then((res: any) => res.data),
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('document_type', documentType);

            documentFiles.forEach((file) => {
                formData.append('document_files', file);
            });

            if (selfieFile) {
                formData.append('selfie_file', selfieFile, selfieFile.name);
            } else if (selfieCapture) {
                const res = await fetch(selfieCapture);
                const blob = await res.blob();
                formData.append('selfie_file', blob, 'selfie.jpg');
            }

            return api.post('/verifications/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verification-status'] });
            setSelfieCapture(null);
            setSelfieFile(null);
            setDocumentFiles([]);
        },
    });

    const captureSelfie = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setSelfieCapture(imageSrc);
        }
    }, []);

    const handleSelfieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelfieFile(file);
        setSelfieCapture(URL.createObjectURL(file));
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDocumentFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = () => {
        if ((selfieCapture || selfieFile) && documentFiles.length > 0) {
            submitMutation.mutate();
        }
    };

    const canSubmit = (!!selfieCapture || !!selfieFile) && documentFiles.length > 0 && !submitMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Seller Verification</h1>
                <p className="text-gray-500">Verify your identity to start posting ads on Suqafuran</p>
            </div>

            {/* Status Banner */}
            {status && (
                <div className={cn(
                    "mb-8 p-5 rounded-2xl border-2 flex items-center gap-4",
                    status.status === 'approved' ? "bg-green-50 border-green-200" :
                        status.status === 'pending' ? "bg-blue-50 border-blue-200" :
                            "bg-red-50 border-red-200"
                )}>
                    {status.status === 'approved' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-900">You are a Verified Seller</h3>
                                <p className="text-sm text-green-700">Your account is verified. You can post ads freely.</p>
                            </div>
                            <Shield className="w-8 h-8 text-green-500 ml-auto shrink-0" />
                        </>
                    ) : status.status === 'pending' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900">Verification Under Review</h3>
                                <p className="text-sm text-blue-700">Your documents are being reviewed. This usually takes 24-48 hours.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-900">Verification Rejected</h3>
                                <p className="text-sm text-red-700">Your previous request was rejected. Please resubmit clearer documents.</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Success state after submit */}
            {submitMutation.isSuccess && (
                <div className="mb-8 p-5 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900">Documents Submitted!</h3>
                        <p className="text-sm text-blue-700">We'll review your documents and notify you within 24-48 hours.</p>
                    </div>
                </div>
            )}

            {/* Error state */}
            {submitMutation.isError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">
                        {(submitMutation.error as any)?.response?.data?.detail || 'Submission failed. Please try again.'}
                    </p>
                </div>
            )}

            {/* Form — only show if not pending/approved */}
            {(!status || status.status === 'rejected') && !submitMutation.isSuccess && (
                <div className="space-y-6">
                    {/* Document Type */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">1. Select Document Type</h3>
                        <div className="relative">
                            <select
                                value={documentType}
                                onChange={e => setDocumentType(e.target.value)}
                                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {DOCUMENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-1">2. Upload ID Document</h3>
                        <p className="text-sm text-gray-500 mb-4">Upload both sides if applicable (front & back)</p>

                        <label className="block cursor-pointer">
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleDocumentUpload}
                                className="hidden"
                            />
                            <div className={cn(
                                "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                                documentFiles.length > 0
                                    ? "border-green-300 bg-green-50"
                                    : "border-gray-200 hover:border-primary-300 hover:bg-primary-50/30"
                            )}>
                                {documentFiles.length > 0 ? (
                                    <div className="space-y-2">
                                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                                        <p className="font-semibold text-green-800">
                                            {documentFiles.length} file{documentFiles.length > 1 ? 's' : ''} selected
                                        </p>
                                        <ul className="text-xs text-green-700 space-y-0.5">
                                            {documentFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                                        </ul>
                                        <p className="text-xs text-green-600 mt-1">Click to change</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                                        <p className="font-semibold text-gray-600">Click to upload</p>
                                        <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Selfie */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900">3. Take a Selfie</h3>
                                <p className="text-sm text-gray-500">Clear photo of your face holding your ID</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setSelfieMode('upload'); setSelfieCapture(null); setSelfieFile(null); }}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        selfieMode === 'upload' ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100")}
                                >
                                    <ImageIcon className="w-3.5 h-3.5 inline mr-1" />Upload
                                </button>
                                <button
                                    onClick={() => { setSelfieMode('webcam'); setSelfieCapture(null); setSelfieFile(null); }}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        selfieMode === 'webcam' ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100")}
                                >
                                    <Camera className="w-3.5 h-3.5 inline mr-1" />Camera
                                </button>
                            </div>
                        </div>

                        {selfieMode === 'upload' ? (
                            <label className="block cursor-pointer">
                                <input type="file" accept="image/*" capture="user" onChange={handleSelfieFile} className="hidden" />
                                <div className={cn(
                                    "border-2 border-dashed rounded-xl transition-colors overflow-hidden",
                                    selfieCapture ? "border-green-300" : "border-gray-200 hover:border-primary-300"
                                )}>
                                    {selfieCapture ? (
                                        <div className="relative">
                                            <img src={selfieCapture} alt="Selfie" className="w-full max-h-64 object-cover rounded-xl" />
                                            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-center text-xs text-green-700 bg-green-50 py-2">Tap to retake</p>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center space-y-2">
                                            <Camera className="w-10 h-10 text-gray-400 mx-auto" />
                                            <p className="font-semibold text-gray-600">Click to take / upload selfie</p>
                                            <p className="text-xs text-gray-400">On mobile, this will open your camera</p>
                                        </div>
                                    )}
                                </div>
                            </label>
                        ) : (
                            <div>
                                <div className="rounded-xl overflow-hidden bg-gray-900 mb-3 max-h-72">
                                    {selfieCapture ? (
                                        <img src={selfieCapture} alt="Selfie" className="w-full object-cover" />
                                    ) : webcamError ? (
                                        <div className="h-48 flex flex-col items-center justify-center gap-2 text-gray-400">
                                            <AlertCircle className="w-8 h-8" />
                                            <p className="text-sm">Camera not available</p>
                                            <button
                                                onClick={() => { setSelfieMode('upload'); setWebcamError(false); }}
                                                className="text-xs text-primary-400 underline"
                                            >Switch to upload</button>
                                        </div>
                                    ) : (
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full"
                                            videoConstraints={{ facingMode: 'user' }}
                                            onUserMediaError={() => setWebcamError(true)}
                                        />
                                    )}
                                </div>
                                {selfieCapture ? (
                                    <Button variant="outline" className="w-full rounded-xl" onClick={() => setSelfieCapture(null)}>
                                        <RefreshCw className="w-4 h-4 mr-2" />Retake
                                    </Button>
                                ) : !webcamError && (
                                    <Button className="w-full rounded-xl bg-primary-600 hover:bg-primary-700" onClick={captureSelfie}>
                                        <Camera className="w-4 h-4 mr-2" />Capture Photo
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <Button
                        className="w-full rounded-xl py-3 text-base"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        {submitMutation.isPending ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Uploading documents...</>
                        ) : (
                            <><Shield className="w-5 h-5 mr-2" />Submit for Verification</>
                        )}
                    </Button>
                </div>
            )}

            {/* Info */}
            <div className="mt-8 bg-blue-50 rounded-2xl p-5 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-3">Why verify your account?</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                    {[
                        'You must be verified to post ads on Suqafuran',
                        'Build trust with buyers and increase sales',
                        'Get a verified badge on your profile and listings',
                        'Unlock higher-tier promotion plans',
                    ].map(text => (
                        <li key={text} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export { VerificationPage };
