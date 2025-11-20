import React from 'react';

interface FolderIconProps {
  className?: string;
}

export default function FolderIcon({ className = 'w-5 h-5' }: FolderIconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2 2h9a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" />
    </svg>
  );
}

