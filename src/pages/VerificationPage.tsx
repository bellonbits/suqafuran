```typescript
import React, { useState } from 'react';
import Webcam from 'react-webcam';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Camera, Upload, CheckCircle, XCircle, Shield, Loader2 } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/Button';

import { cn } from '../utils/cn';

const VerificationPage: React.FC = () => {
    const [selfieCapture, setSelfieCapture] = useState<string | null>(null);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const webcamRef = React.useRef<Webcam>(null);

    const { data: status, isLoading } = useQuery({
        queryKey: ['verification-status'],
        queryFn: () => api.get('/verifications/me').then((res: any) => res.data),
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('document_type', 'id');

            documentFiles.forEach((file) => {
                formData.append('document_files', file);
            });

            if (selfieCapture) {
                const base64Response = await fetch(selfieCapture);
                const blob = await base64Response.blob();
                formData.append('selfie_file', blob, 'selfie.jpg');
            }

            return api.post('/verifications/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            setSelfieCapture(null);
            setDocumentFiles([]);
        },
    });

    const captureSelfie = React.useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setSelfieCapture(imageSrc);
        }
    }, [webcamRef]);

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDocumentFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = () => {
        if (selfieCapture && documentFiles.length > 0) {
            submitMutation.mutate();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller Verification</h1>
                <p className="text-gray-600">Complete your verification to build trust with buyers</p>
            </div>

            {/* Verification Status Card */}
            {status && (
                <div className={cn(
                    "mb-8 p-6 rounded-2xl border-2 flex items-center gap-4",
                    status.status === 'approved' ? "bg-green-50 border-green-200" :
                        status.status === 'pending' ? "bg-blue-50 border-blue-200" :
                            "bg-red-50 border-red-200"
                )}>
                    {status.status === 'approved' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-green-900">Verified Seller</h3>
                                <p className="text-sm text-green-700">Your account has been successfully verified</p>
                            </div>
                            <Shield className="w-8 h-8 text-green-600" />
                        </>
                    ) : status.status === 'pending' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900">Verification Pending</h3>
                                <p className="text-sm text-blue-700">Your documents are under review (24-48 hours)</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-red-900">Verification Rejected</h3>
                                <p className="text-sm text-red-700">Please submit new documents</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Main Verification Grid */}
            {(!status || status.status === 'rejected') && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Selfie Capture Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                <Camera className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Take a Selfie</h3>
                                <p className="text-sm text-gray-500">Capture a clear photo of your face</p>
                            </div>
                        </div>

                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 mb-4 relative">
                            {selfieCapture ? (
                                <img src={selfieCapture} alt="Selfie" className="w-full h-full object-cover" />
                            ) : (
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover"
                                    videoConstraints={{ facingMode: "user", aspectRatio: 0.75 }}
                                />
                            )}
                            {selfieCapture && (
                                <div className="absolute top-3 right-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {selfieCapture ? (
                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                                onClick={() => setSelfieCapture(null)}
                            >
                                Retake Photo
                            </Button>
                        ) : (
                            <Button
                                className="w-full rounded-xl bg-primary-600 hover:bg-primary-700"
                                onClick={captureSelfie}
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Capture Photo
                            </Button>
                        )}
                    </div>

                    {/* Document Upload Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                <Upload className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Upload ID Document</h3>
                                <p className="text-sm text-gray-500">National ID, Passport, or Driver's License</p>
                            </div>
                        </div>

                        <label className="block">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleDocumentUpload}
                                className="hidden"
                            />
                    disabled={!selfieCapture || documentFiles.length === 0 || submitMutation.isPending}
                    onClick={handleSubmit}
                >
                    {submitMutation.isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Shield className="w-5 h-5 mr-2" />
                            Submit for Verification
                        </>
                    )}
                </Button>
            </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-3">Why verify your account?</h4>
            <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Build trust with buyers and increase sales</span>
                </li>
                <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Get a verified badge on your profile</span>
                </li>
                <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Rank higher in search results</span>
                </li>
            </ul>
        </div>
    </div>
);
};

export { VerificationPage };
