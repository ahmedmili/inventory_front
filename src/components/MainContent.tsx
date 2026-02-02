'use client';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main
      className={`flex-1 flex flex-col min-h-0 min-w-0 max-w-full overflow-hidden bg-gray-50 ${className}`}
    >
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

