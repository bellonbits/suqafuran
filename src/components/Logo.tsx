import React from 'react';
import { cn } from '../utils/cn';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
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
                className={cn("w-auto object-contain", dimensions[size])}
            />
        </div>
    );
};

export { Logo };
