import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UrlSyncParams {
  [key: string]: string | number | undefined | null;
}

export function useUrlSync(params: UrlSyncParams, options?: { scroll?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        urlParams.set(key, String(value));
      }
    });

    const newUrl = urlParams.toString();
    const currentUrl = searchParams?.toString() || '';

    if (newUrl !== currentUrl) {
      router.replace(`?${newUrl}`, { scroll: options?.scroll ?? false });
    }
  }, [params, router, searchParams, options?.scroll]);
}
