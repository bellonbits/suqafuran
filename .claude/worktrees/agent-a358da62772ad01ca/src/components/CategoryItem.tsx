import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface CategoryItemProps {
    label: string;
    icon: LucideIcon;
    colorClass?: string;
    onClick?: () => void;
    className?: string;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
    label,
    icon: Icon,
    colorClass = 'bg-primary-50 text-primary-600',
    onClick,
    className,
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                'group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100',
                className
            )}
        >
            <div className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
                colorClass
            )}>
                <Icon className="h-7 w-7" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {label}
            </span>
        </button>
    );
};

export { CategoryItem };
