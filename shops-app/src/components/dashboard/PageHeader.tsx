import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={cn("space-y-2 mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-slate-700 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && "font-semibold text-slate-600")}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

