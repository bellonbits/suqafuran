import React from 'react';
import { Globe } from 'lucide-react';

const CurrencySwitcher: React.FC = () => {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-[11px] font-bold text-gray-700">USD</span>
        </div>
    );
};

export { CurrencySwitcher };
