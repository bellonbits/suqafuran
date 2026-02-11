import React from 'react';
import { cn } from '../utils/cn';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5 text-left">
                {label && (
                    <label className="text-sm font-medium text-gray-400 select-none ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'flex h-12 w-full rounded-xl border border-white/5 bg-[#252131] px-4 py-3 text-sm text-gray-200 ring-offset-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all autofill:bg-[#252131] autofill:text-gray-200',
                            icon && 'pl-11',
                            error && 'border-red-500/50 focus-visible:ring-red-500/50',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs text-red-500/80 font-medium ml-1">{error}</p>
                )}
            </div>
        );
    }
);

AuthInput.displayName = 'AuthInput';

export { AuthInput };
