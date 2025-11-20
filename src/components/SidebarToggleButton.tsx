'use client';

import { useEffect, useState } from 'react';

interface SidebarToggleButtonProps {
  isMinimized: boolean;
  isOpen: boolean;
  onToggleMinimize: () => void;
  onToggleOpen: () => void;
}

export default function SidebarToggleButton({
  isMinimized,
  isOpen,
  onToggleMinimize,
  onToggleOpen,
}: SidebarToggleButtonProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleClick = () => {
    // On both desktop and mobile, toggle minimize/expand
    // If sidebar is minimized, expand it; otherwise minimize it
    onToggleMinimize();
  };

  // Determine button position and icon rotation
  const getButtonPosition = () => {
    // Button positioned at the right edge of the sidebar
    // Minimized sidebar: 80px (5rem = left-20)
    // Expanded sidebar: 256px (16rem = left-64)
    if (isDesktop) {
      return isMinimized ? 'left-20' : 'left-64';
    } else {
      if (isMinimized) {
        return 'left-20'; // At minimized sidebar edge (80px)
      } else if (isOpen) {
        return 'left-64'; // At expanded sidebar edge (256px)
      } else {
        return 'left-4'; // When sidebar is closed
      }
    }
  };

  const getIconRotation = () => {
    // Icon rotates: right arrow when minimized/closed, left arrow when expanded/open
    if (isDesktop) {
      return isMinimized ? 'rotate(0deg)' : 'rotate(180deg)';
    } else {
      return isMinimized ? 'rotate(0deg)' : (isOpen ? 'rotate(180deg)' : 'rotate(0deg)');
    }
  };

  const getAriaLabel = () => {
    return isMinimized ? "Agrandir la sidebar" : "Minimiser la sidebar";
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed top-4 z-50 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg shadow-md transition-all duration-300 bg-white border border-gray-200 ${getButtonPosition()} ${isMinimized ? 'lg:z-30' : ''}`}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      <svg 
        className="w-5 h-5 transition-transform duration-300" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{ transform: getIconRotation() }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

