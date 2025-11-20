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
    if (isDesktop) {
      onToggleMinimize();
    } else {
      onToggleOpen();
    }
  };

  // Determine button position and icon rotation
  const getButtonPosition = () => {
    if (isDesktop) {
      return isMinimized ? 'left-4' : 'left-64';
    } else {
      return isOpen ? 'left-64' : 'left-4';
    }
  };

  const getIconRotation = () => {
    if (isDesktop) {
      return isMinimized ? 'rotate(0deg)' : 'rotate(180deg)';
    } else {
      return isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  };

  const getAriaLabel = () => {
    if (isDesktop) {
      return isMinimized ? "Agrandir la sidebar" : "Minimiser la sidebar";
    } else {
      return isOpen ? "Fermer la sidebar" : "Ouvrir la sidebar";
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed top-4 z-50 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg shadow-md transition-all duration-300 bg-white border border-gray-200 ${getButtonPosition()}`}
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

