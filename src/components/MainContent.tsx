'use client';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main
      className={`flex-1 overflow-y-auto bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </main>
  );
}

