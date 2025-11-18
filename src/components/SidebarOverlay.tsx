'use client';

interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarOverlay({ isOpen, onClose }: SidebarOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

