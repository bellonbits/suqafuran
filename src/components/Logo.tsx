import React from 'react';
import { cn } from '../utils/cn';

interface LogoProps {
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md', variant = 'default' }) => {
    const dimensions = {
        xs: 'h-7',
        sm: 'h-8',
        md: 'h-11',
        lg: 'h-14',
    };

    return (
        <div className={cn("inline-flex items-center select-none", className)}>
            <img src="/icon1.png" alt="Suqafuran" className={cn(
                "w-auto object-contain",
                dimensions[size],
                variant === 'white' && "brightness-0 invert"
            )} />
        </div>
    );
};

export { Logo };
