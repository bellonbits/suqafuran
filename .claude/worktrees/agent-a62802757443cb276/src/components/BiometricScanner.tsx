import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Loader2, CheckCircle, Fingerprint, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface BiometricScannerProps {
    onComplete: (result: any) => void;
    onCancel: () => void;
    fetchResult: () => Promise<any>;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({ onComplete, onCancel, fetchResult }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'scanning' | 'analyzing' | 'complete'>('scanning');
    const [scanLines, setScanLines] = useState<number[]>([]);
    const [realResult, setRealResult] = useState<any>(null);

    useEffect(() => {
        if (status === 'scanning') {
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        clearInterval(interval);
                        setStatus('analyzing');
                        return 100;
                    }
                    return p + 2;
                });
                setScanLines(prev => [...prev, Math.random() * 100].slice(-5));
            }, 50);
            return () => clearInterval(interval);
        } else if (status === 'analyzing') {
            let isCancelled = false;
            fetchResult().then(res => {
                if (!isCancelled) {
                    setRealResult(res);
                    setStatus('complete');
                    setTimeout(() => {
                        onComplete(res);
                    }, 1500);
                }
            }).catch(() => {
                if (!isCancelled) {
                    setRealResult({ match_score: 0, is_authentic: false, reason: "Error contacting AI server" });
                    setStatus('complete');
                    setTimeout(() => {
                        onComplete({ match_score: 0, is_authentic: false, reason: "Error contacting AI server" });
                    }, 1500);
                }
            });
            return () => { isCancelled = true; };
        }
    }, [status, onComplete]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">
                
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="p-8 relative">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4 border border-primary-500/30">
                            <Shield className="h-8 w-8 text-primary-400 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight text-center uppercase">
                            Smart Biometric Protocol
                        </h2>
                        <p className="text-primary-400/60 text-[10px] font-bold tracking-[0.2em] mt-1">
                            SECURE ACCESS • VERIFICATION V3.4
                        </p>
                    </div>

                    {/* Scanner Window */}
                    <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-800/40 border border-white/5 mb-8">
                        {/* Simulated Webcam View with Laser */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Fingerprint size={120} className="text-white/5" />
                        </div>

                        {/* Laser Line */}
                        {status === 'scanning' && (
                            <div 
                                className="absolute left-0 right-0 h-0.5 bg-primary-500 shadow-[0_0_15px_#3b82f6] z-10 transition-all duration-75"
                                style={{ top: `${(Math.sin(Date.now() / 200) * 50) + 50}%` }}
                            />
                        )}

                        {/* Scanning Dots */}
                        {status === 'scanning' && scanLines.map((line, i) => (
                            <div 
                                key={i}
                                className="absolute w-1.5 h-1.5 bg-primary-400 rounded-full opacity-40"
                                style={{ 
                                    top: `${line}%`, 
                                    left: `${Math.random() * 100}%`,
                                    transition: 'all 0.5s ease-out'
                                }}
                            />
                        ))}

                        {/* Overlay Icons */}
                        <div className="absolute top-4 left-4 flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[8px] font-bold text-white/40 uppercase">Live Analysis</span>
                        </div>

                        {/* Status Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            {status === 'analyzing' && (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Processing Landmarks</span>
                                </div>
                            )}
                            {status === 'complete' && (
                                <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-300">
                                    {realResult?.is_authentic === false ? (
                                        <>
                                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_20px_#ef4444]">
                                                <XCircle className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="text-xs font-black text-red-400 uppercase tracking-widest text-center">Invalid Document<br/><span className="text-[8px] opacity-80 mt-1 block leading-tight max-w-[150px]">Image does not appear to be a valid ID card</span></span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_#22c55e]">
                                                <CheckCircle className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="text-xs font-black text-green-400 uppercase tracking-widest">Match Confirmed</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">System Progress</span>
                                <span className="text-sm font-black text-white">{progress}%</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Status</span>
                                <p className={cn(
                                    "text-xs font-bold uppercase",
                                    status === 'scanning' ? "text-primary-400" :
                                    status === 'analyzing' ? "text-yellow-400" : "text-green-400"
                                )}>
                                    {status}...
                                </p>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary-500 transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={onCancel}
                            className="flex-1 py-3 text-[11px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Abort Protocol
                        </button>
                    </div>
                </div>

                {/* Cyberpunk corner details */}
                <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Sparkles className="h-4 w-4 text-white" />
                </div>
            </div>
        </div>
    );
};
