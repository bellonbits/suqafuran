import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
    ({ className, label, error, icon, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
                        type={inputType}
                        className={cn(
                            'flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[16px] md:text-sm text-gray-900 ring-offset-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all autofill:bg-gray-50 autofill:text-gray-900',
                            icon && 'pl-11',
                            isPassword && 'pr-11',
                            error && 'border-red-500/50 focus-visible:ring-red-500/50',
                            className
                        )}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    )}
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
