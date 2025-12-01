'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/contexts/LoadingContext';

/**
 * Composant global qui ferme le loader dès que la route (pathname) change.
 * À utiliser une seule fois tout en haut de l'arbre React (par ex. dans RootLayout via Providers/LayoutSelector).
 */
export default function NavigationLoaderHandler() {
  const pathname = usePathname();
  const { hideLoader } = useLoading();

  useEffect(() => {
    // À chaque changement de route, on s'assure de masquer le loader global
    hideLoader();
  }, [pathname, hideLoader]);

  return null;
}


