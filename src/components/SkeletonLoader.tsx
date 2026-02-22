'use client';

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
      aria-hidden
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex gap-4 flex-wrap">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLoader key={i} className="h-8 flex-1 min-w-[80px]" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 flex-wrap">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <SkeletonLoader key={colIdx} className="h-10 flex-1 min-w-[80px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <SkeletonLoader className="h-6 w-3/4 mb-4" />
      <SkeletonLoader className="h-4 w-full mb-2" />
      <SkeletonLoader className="h-4 w-5/6" />
    </div>
  );
}

