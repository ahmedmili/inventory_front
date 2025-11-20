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
    <div className={`relative flex items-center border-b border-gray-100 ${isMinimized ? 'px-3 py-4 justify-center' : 'px-5 py-4 justify-between'}`}>
      {!isMinimized ? (
        <div className="flex items-center gap-3 flex-1">
          {/* Colorful Logo */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-blue-500 to-green-500 p-1.5 shadow-sm">
              <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
                <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                  <div className="bg-red-500 rounded-tl"></div>
                  <div className="bg-blue-500 rounded-tr"></div>
                  <div className="bg-green-500 rounded-bl"></div>
                  <div className="bg-yellow-500 rounded-br"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Title and Subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
            <p className="text-xs text-gray-500 truncate">gestion-stock.com</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <button
            onClick={onToggleMinimize}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-blue-500 to-green-500 p-1.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            aria-label="Agrandir la sidebar"
            title="Agrandir"
          >
            <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                <div className="bg-red-500 rounded-tl"></div>
                <div className="bg-blue-500 rounded-tr"></div>
                <div className="bg-green-500 rounded-bl"></div>
                <div className="bg-yellow-500 rounded-br"></div>
              </div>
            </div>
          </button>
        </div>
      )}
      {!isMinimized && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="hidden lg:flex text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
              aria-label="Minimiser la sidebar"
              title="Minimiser"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50"
              aria-label="Fermer la sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
