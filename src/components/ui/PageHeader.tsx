import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/icons';

interface PageHeaderProps {
  title: string;
  description?: string;
  backUrl?: string;
  actions?: ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function PageHeader({
  title,
  description,
  backUrl,
  actions,
  gradientFrom = 'from-blue-50',
  gradientTo = 'to-indigo-50',
}: PageHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-2xl p-6 sm:p-8 border border-blue-100 shadow-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {backUrl && (
            <Link
              href={backUrl}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all duration-200 transform hover:scale-110"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-sm sm:text-base text-gray-600">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
