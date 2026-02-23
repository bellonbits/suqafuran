import React from 'react';
import { cn } from '../utils/cn';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md', variant = 'default' }) => {
    const dimensions = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-12',
    };

    return (
        <div className={cn("inline-flex items-center select-none", className)}>
            <img
                src="/suqafuran.svg"
                alt="Suqafuran"
                className={cn(
                    "w-auto object-contain",
                    dimensions[size],
                    variant === 'white' && "brightness-0 invert"
                )}
            />
        </div>
    );
};

export { Logo };
