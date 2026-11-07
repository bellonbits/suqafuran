import React from 'react';

export const ShoppingLoadingState: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 space-y-3 animate-pulse"
        >
          <div className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-neutral-800" />
          <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-1/2" />
          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex justify-between items-center">
            <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-1/3" />
            <div className="h-8 bg-slate-100 dark:bg-neutral-800 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};
