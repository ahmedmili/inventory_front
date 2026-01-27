import React, { ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/icons';

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  count?: number;
  headerGradient?: string;
  showDivider?: boolean;
}

export default function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  count,
  headerGradient = 'from-blue-500 to-indigo-500',
  showDivider = true,
}: CollapsibleSectionProps) {
  return (
    <div className="border-t-2 border-gray-200 bg-gradient-to-br from-blue-50/50 via-gray-50 to-purple-50/50 overflow-hidden">
      <div className="p-5 sm:p-7 animate-in slide-in-from-top-2 duration-300">
        <div className="mb-6">
          <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-2 flex items-center gap-3">
            <div className={`h-1 w-8 bg-gradient-to-r ${headerGradient} rounded-full`}></div>
            <span>{title}</span>
            {count !== undefined && (
              <span className="ml-auto px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs sm:text-sm">
                {count}
              </span>
            )}
          </h4>
          {showDivider && (
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-2"></div>
          )}
        </div>
        {isExpanded && children}
      </div>
    </div>
  );
}
