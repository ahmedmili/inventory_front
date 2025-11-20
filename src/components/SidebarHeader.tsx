'use client';

interface SidebarHeaderProps {
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function SidebarHeader({ 
  title = 'Gestion de Stock Pro', 
  onClose,
  showCloseButton = false,
  isMinimized = false,
  onToggleMinimize
}: SidebarHeaderProps) {
  return (
    <div className={`flex items-center h-16 border-b border-gray-200 ${isMinimized ? 'px-3 justify-center' : 'px-6 justify-between'}`}>
      {!isMinimized && (
        <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
      )}
      {isMinimized && (
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">GS</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="hidden lg:flex text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-colors"
            aria-label={isMinimized ? "Agrandir la sidebar" : "Minimiser la sidebar"}
            title={isMinimized ? "Agrandir" : "Minimiser"}
          >
            {isMinimized ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        )}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded hover:bg-gray-100"
            aria-label="Fermer la sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

