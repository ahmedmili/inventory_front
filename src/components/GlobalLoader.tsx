'use client';

import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoader() {
  const { isLoading, message } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        <p className="text-sm text-gray-700 font-medium">
          {message || 'Chargement en cours...'}
        </p>
      </div>
    </div>
  );
}


