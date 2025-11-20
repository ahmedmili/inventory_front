'use client';

interface SidebarHeaderProps {
  title?: string;
  isMinimized?: boolean;
}

export default function SidebarHeader({ 
  title = 'Gestion de Stock Pro', 
  isMinimized = false,
}: SidebarHeaderProps) {

  return (
    <div className={`relative flex items-center border-b border-gray-100 ${isMinimized ? 'px-3 py-4 justify-center pt-16' : 'px-5 py-4 justify-between'}`}>
      {!isMinimized ? (
        <>
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
        </>
      ) : (
        <div className="flex items-center justify-center w-full group relative">
          {/* Logo when minimized - positioned below toggle button */}
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
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 shadow-lg">
            {title}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}
