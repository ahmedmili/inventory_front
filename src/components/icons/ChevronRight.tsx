import React from 'react';

interface ChevronRightProps {
  className?: string;
}

export default function ChevronRight({ className = 'w-4 h-4' }: ChevronRightProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

