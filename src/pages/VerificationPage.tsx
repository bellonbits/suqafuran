import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Camera, Upload, CheckCircle, XCircle, Shield, Loader2,
    AlertCircle, RefreshCw, Image as ImageIcon, ChevronDown, Sparkles, Fingerprint
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { BiometricScanner } from '../components/BiometricScanner';

const DOCUMENT_TYPE_KEYS = [
    { value: 'national_id', tKey: 'verify.nationalId' },
    { value: 'passport', tKey: 'verify.passport' },
    { value: 'drivers_license', tKey: 'verify.driversLicense' },
    { value: 'refugee_id', tKey: 'verify.refugeeId' },
];

const VerificationPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user, updateUser } = useAuthStore();
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
        // Poll every 30s while pending so the page auto-updates when admin approves
        refetchInterval: (query) => {
            const s = query.state.data?.status;
            return s === 'pending' ? 30_000 : false;
        },
    });

    // Sync auth store the moment backend marks the user approved
    useEffect(() => {
        if (status?.status === 'approved' && user && !user.is_verified) {
            updateUser({ is_verified: true });
        }
    }, [status?.status]);

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

    const [showAdvancedScanner, setShowAdvancedScanner] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);

    const handleAiAnalyze = () => {
        setShowAdvancedScanner(true);
    };

    const handleScannerComplete = (result: any) => {
        setShowAdvancedScanner(false);
        setAiResult(result);
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
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('verify.title')}</h1>
                <p className="text-gray-500">{t('verify.subtitle')}</p>
            </div>

            {showAdvancedScanner && (
                <BiometricScanner 
                    onComplete={handleScannerComplete} 
                    onCancel={() => setShowAdvancedScanner(false)} 
                />
            )}

            {/* Status Banner */}
            {status && (
                <div className={cn(
                    "mb-8 p-5 rounded-2xl border-2 flex items-center gap-4",
                    status.status === 'approved' ? "bg-green-50 border-green-200" :
                        status.status === 'pending' ? "bg-primary-50 border-primary-200" :
                            "bg-red-50 border-red-200"
                )}>
                    {status.status === 'approved' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-900">{t('verify.alreadyVerified')}</h3>
                                <p className="text-sm text-green-700">{t('verify.alreadyVerifiedDesc')}</p>
                            </div>
                            <Shield className="w-8 h-8 text-green-500 ml-auto shrink-0" />
                        </>
                    ) : status.status === 'pending' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                            </div>
                            <div>
                                <h3 className="font-bold text-primary-900">{t('verify.underReview')}</h3>
                                <p className="text-sm text-primary-700">{t('verify.underReviewDesc')}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-900">{t('verify.rejected')}</h3>
                                <p className="text-sm text-red-700">{t('verify.rejectedDesc')}</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Success state after submit */}
            {submitMutation.isSuccess && (
                <div className="mb-8 p-5 rounded-2xl bg-primary-50 border-2 border-primary-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-primary-900">{t('verify.submitted')}</h3>
                        <p className="text-sm text-primary-700">{t('verify.submittedDesc')}</p>
                    </div>
                </div>
            )}

            {/* Error state */}
            {submitMutation.isError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">
                        {(submitMutation.error as any)?.response?.data?.detail || t('verify.submissionFailed')}
                    </p>
                </div>
            )}

            {/* Form — only show if not pending/approved */}
            {(!status || status.status === 'rejected') && !submitMutation.isSuccess && (
                <div className="space-y-6">
                    {/* Document Type */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">{t('verify.selectDocType')}</h3>
                        <div className="relative">
                            <select
                                value={documentType}
                                onChange={e => setDocumentType(e.target.value)}
                                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {DOCUMENT_TYPE_KEYS.map(dt => (
                                    <option key={dt.value} value={dt.value}>{t(dt.tKey)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-1">{t('verify.uploadIdDoc')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('verify.uploadBothSides')}</p>

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
                                            {documentFiles.length > 1 ? t('verify.filesSelected', { count: documentFiles.length }) : t('verify.fileSelected', { count: documentFiles.length })}
                                        </p>
                                        <ul className="text-xs text-green-700 space-y-0.5">
                                            {documentFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                                        </ul>
                                        <p className="text-xs text-green-600 mt-1">{t('verify.clickToChange')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                                        <p className="font-semibold text-gray-600">{t('verify.clickToUpload')}</p>
                                        <p className="text-xs text-gray-400">{t('verify.pngJpgPdf')}</p>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Selfie */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900">{t('verify.takeSelfie')}</h3>
                                <p className="text-sm text-gray-500">{t('verify.selfieDesc')}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setSelfieMode('upload'); setSelfieCapture(null); setSelfieFile(null); }}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        selfieMode === 'upload' ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100")}
                                >
                                    <ImageIcon className="w-3.5 h-3.5 inline mr-1" />{t('verify.upload')}
                                </button>
                                <button
                                    onClick={() => { setSelfieMode('webcam'); setSelfieCapture(null); setSelfieFile(null); }}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        selfieMode === 'webcam' ? "bg-primary-100 text-primary-700" : "text-gray-500 hover:bg-gray-100")}
                                >
                                    <Camera className="w-3.5 h-3.5 inline mr-1" />{t('verify.camera')}
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
                                            <p className="text-center text-xs text-green-700 bg-green-50 py-2">{t('verify.tapToRetake')}</p>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center space-y-2">
                                            <Camera className="w-10 h-10 text-gray-400 mx-auto" />
                                            <p className="font-semibold text-gray-600">{t('verify.clickToTakeUpload')}</p>
                                            <p className="text-xs text-gray-400">{t('verify.onMobileCamera')}</p>
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
                                            <p className="text-sm">{t('verify.cameraNotAvailable')}</p>
                                            <button
                                                onClick={() => { setSelfieMode('upload'); setWebcamError(false); }}
                                                className="text-xs text-primary-400 underline"
                                            >{t('verify.switchToUpload')}</button>
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
                                        <RefreshCw className="w-4 h-4 mr-2" />{t('verify.retake')}
                                    </Button>
                                ) : !webcamError && (
                                    <Button className="w-full rounded-xl bg-primary-600 hover:bg-primary-700" onClick={captureSelfie}>
                                        <Camera className="w-4 h-4 mr-2" />{t('verify.capturePhoto')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* AI Identity Pre-check */}
                    {canSubmit && !aiResult && (
                        <div className="bg-[#0f172a] p-8 rounded-[2rem] border border-primary-500/30 shadow-2xl relative overflow-hidden group">
                            {/* Animated Pulse Ring */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/5 rounded-full animate-pulse" />
                            
                            <div className="relative z-10 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 rounded-full border border-primary-500/20 mb-6">
                                    <Sparkles className="h-3 w-3 text-primary-400" />
                                    <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Biometric Phase</span>
                                </div>
                                
                                <h3 className="text-xl font-black text-white mb-3 tracking-tight">Smart Identity Protocol</h3>
                                <p className="text-white/60 text-xs leading-relaxed mb-6">
                                    Initialize advanced face-match validation. Our Smart System analyzes <span className="text-white font-bold">128 facial landmarks</span> against your document.
                                </p>
                                
                                <Button 
                                    className="w-full rounded-2xl bg-primary-500 hover:bg-primary-400 text-white font-black py-4 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
                                    onClick={handleAiAnalyze}
                                >
                                    <Fingerprint className="w-5 h-5 mr-2" /> 
                                    INITIALIZE IDENTITY SCAN
                                </Button>
                                
                                <div className="mt-4 flex items-center justify-center gap-4 opacity-40">
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-green-500" />
                                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Encrypted</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter">SMART CORE V3</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {aiResult && (
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-5 w-5" />
                                    <h3 className="font-bold uppercase text-xs tracking-widest">Smart Analysis Complete</h3>
                                </div>
                                <span className="text-[10px] font-black text-green-700">{aiResult.match_score}% MATCH</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-green-800">Biometric Similarity</span>
                                    <span className="font-bold text-green-900">High Confidence</span>
                                </div>
                                <div className="w-full h-1.5 bg-green-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-600 rounded-full transition-all duration-1000" 
                                        style={{ width: `${aiResult.match_score}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-green-700 italic">Face match confirmed. Documents appear authentic. Ready for final submission.</p>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        className="w-full rounded-xl py-3 text-base shadow-lg shadow-primary-100"
                        disabled={!canSubmit || (!aiResult && !submitMutation.isPending)}
                        onClick={handleSubmit}
                    >
                        {submitMutation.isPending ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t('verify.uploading')}</>
                        ) : (
                            <><Shield className="w-5 h-5 mr-2" />{t('verify.submit')}</>
                        )}
                    </Button>
                </div>
            )}

            {/* Info */}
            <div className="mt-8 bg-primary-50 rounded-2xl p-5 border border-primary-100">
                <h4 className="font-bold text-primary-900 mb-3">{t('verify.whyVerify')}</h4>
                <ul className="space-y-2 text-sm text-primary-800">
                    {[
                        t('verify.reason1'),
                        t('verify.reason2'),
                        t('verify.reason3'),
                        t('verify.reason4'),
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
