import { X, Smartphone, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface LipanaPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (phone: string) => Promise<{ promoId?: number; error?: string }>;
    onPollStatus?: (promoId: number) => Promise<{ status: string; expires_at?: string }>;
    amount: number;
    planName: string;
    listingTitle?: string;
}

type PaymentState = 'idle' | 'submitting' | 'polling' | 'success' | 'error';

export const LipanaPaymentModal: React.FC<LipanaPaymentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onPollStatus,
    amount,
    planName,
    listingTitle,
}) => {
    const { t } = useTranslation();
    const [phone, setPhone] = useState('');
    const [state, setState] = useState<PaymentState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [promoId, setPromoId] = useState<number | null>(null);
    const [pollCount, setPollCount] = useState(0);
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    }, []);

    // Auto-poll when we have a promoId
    useEffect(() => {
        if (state !== 'polling' || !promoId || !onPollStatus) return;
        if (pollCount >= 20) {
            setState('error');
            setErrorMsg(t('payment.timeout'));
            return;
        }

        pollRef.current = setTimeout(async () => {
            try {
                const result = await onPollStatus(promoId);
                if (result.status === 'APPROVED' || result.status === 'approved' || result.status === 'PAID') {
                    setState('success');
                } else {
                    setPollCount(c => c + 1);
                }
            } catch {
                setPollCount(c => c + 1);
            }
        }, 4000);
    }, [state, promoId, pollCount, onPollStatus]);

    const handleSubmit = async () => {
        if (!phone.trim() || phone.length < 9) {
            setErrorMsg(t('payment.invalidPhone'));
            return;
        }
        setErrorMsg('');
        setState('submitting');
        try {
            const result = await onConfirm(phone);
            if (result.error) {
                setState('error');
                setErrorMsg(result.error);
            } else if (result.promoId) {
                setPromoId(result.promoId);
                setPollCount(0);
                setState('polling');
            } else {
                setState('success');
            }
        } catch (e: any) {
            setState('error');
            setErrorMsg(e?.message || t('common.error', 'Something went wrong. Please try again.'));
        }
    };

    const handleClose = () => {
        if (pollRef.current) clearTimeout(pollRef.current);
        setState('idle');
        setPhone('');
        setErrorMsg('');
        setPromoId(null);
        setPollCount(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={state !== 'polling' ? handleClose : undefined} />

            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg tracking-tight leading-none">{t('payment.mpesaTitle')}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <div className="w-1 h-1 rounded-full bg-white/50 animate-pulse" />
                                    <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">{t('payment.secured')}</span>
                                </div>
                            </div>
                        </div>
                        {state !== 'polling' && (
                            <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 text-sm font-medium">
                        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">{t('payment.boostPlan')}</p>
                        <p className="font-black">{planName}</p>
                        {listingTitle && <p className="text-white/80 text-xs mt-1 truncate">"{listingTitle}"</p>}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {state === 'idle' && (
                        <div className="space-y-5">
                            <div>
                                <p className="text-2xl font-black text-gray-900 mb-1">KSh {amount.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">{t('payment.chargedFrom')}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                    {t('payment.phoneLabel')}
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 whitespace-nowrap">
                                        +254
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder={t('payment.phonePlaceholder')}
                                        className="flex-1 px-4 py-3 border-2 border-gray-100 focus:border-green-500 rounded-xl text-sm font-medium outline-none transition-all"
                                    />
                                </div>
                                {errorMsg && (
                                    <p className="flex items-center gap-1.5 text-xs text-red-500 font-bold mt-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                                    </p>
                                )}
                            </div>

                            <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-xs text-green-700 font-medium">
                                {t('payment.promptInfo')}
                            </div>

                            <Button
                                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest"
                                onClick={handleSubmit}
                            >
                                {t('payment.sendRequest')}
                            </Button>
                        </div>
                    )}

                    {state === 'submitting' && (
                        <div className="flex flex-col items-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                            </div>
                            <p className="font-black text-gray-900">{t('payment.sendingRequest')}</p>
                            <p className="text-sm text-gray-500 text-center">{t('payment.waitPrompt')}</p>
                        </div>
                    )}

                    {state === 'polling' && (
                        <div className="flex flex-col items-center py-8 space-y-4">
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-green-100" />
                                <div className="absolute inset-0 rounded-full border-4 border-t-green-500 animate-spin" />
                                <Smartphone className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="font-black text-gray-900 text-lg">{t('payment.waiting')}</p>
                            <p className="text-sm text-gray-500 text-center">
                                {t('payment.checkPhone')}
                            </p>
                            <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-3 text-xs text-amber-700 font-medium text-center">
                                {pollCount > 5 ? t('payment.stillWaiting') : `${t('payment.checkingStatus')} (${pollCount + 1}/20)`}
                            </div>
                        </div>
                    )}

                    {state === 'success' && (
                        <div className="flex flex-col items-center py-8 space-y-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-[bounce_0.5s_ease-out]">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <p className="font-black text-gray-900 text-xl">{t('payment.confirmed')}</p>
                            <p className="text-sm text-gray-500 text-center">
                                {t('payment.successDesc', { planName })}
                            </p>
                            <Button
                                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest"
                                onClick={handleClose}
                            >
                                {t('payment.done')}
                            </Button>
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="flex flex-col items-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="font-black text-gray-900">{t('payment.failed')}</p>
                            <p className="text-sm text-gray-500 text-center">{errorMsg}</p>
                            <Button
                                className="w-full h-12 bg-gray-900 text-white font-black rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                                onClick={() => { setState('idle'); setErrorMsg(''); }}
                            >
                                <RefreshCw className="w-4 h-4" /> {t('payment.tryAgain')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
