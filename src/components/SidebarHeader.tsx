'use client';

import Image from 'next/image';

interface SidebarHeaderProps {
  title?: string;
  isMinimized?: boolean;
}

export default function SidebarHeader({ 
  title = 'Gestion de Stock Pro', 
  isMinimized = false,
}: SidebarHeaderProps) {

  return (
    <div className={`relative flex items-center border-b border-gray-100 justify-center ${isMinimized ? 'px-2 sm:px-3 py-3 sm:py-4 pt-12 sm:pt-16' : 'px-3 sm:px-5 py-3 sm:py-4'}`}>
      {!isMinimized ? (
        <>
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/logo/app_logo.jpeg"
                alt="SAUTER Logo"
                width={120}
                height={36}
                className="h-9 w-auto"
                priority
                unoptimized
              />
            </div>

        </>
      ) : (
        <div className="flex items-center justify-center w-full group relative">
          {/* Logo when minimized - positioned below toggle button */}
          <Image
            src="/logo/app_logo.jpeg"
            alt="SAUTER Logo"
            width={80}
            height={24}
            className="h-6 w-auto"
            priority
            unoptimized
          />
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 shadow-lg">
            {title}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}
