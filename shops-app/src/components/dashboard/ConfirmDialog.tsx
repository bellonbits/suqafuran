import React from 'react';
import { AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
              tone === 'danger' && "bg-rose-50 text-rose-600",
              tone === 'primary' && "bg-sky-50 text-sky-600",
              tone === 'success' && "bg-emerald-50 text-emerald-600"
            )}
          >
            {tone === 'danger' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : tone === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-sky-600" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-1.5",
              tone === 'danger' && "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",
              tone === 'primary' && "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20",
              tone === 'success' && "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            )}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

