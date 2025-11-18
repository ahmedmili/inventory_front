'use client';

interface SidebarHeaderProps {
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function SidebarHeader({ 
  title = 'Gestion de Stock Pro', 
  onClose,
  showCloseButton = false 
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Fermer la sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

