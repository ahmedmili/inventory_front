/**
 * Google Analytics 4 - helpers for custom events.
 * Use these when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 */

const GA_ID = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined;

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('event', eventName, params);
  }
}

/** Exemple : trackEvent('login', { method: 'email' }); */
export function trackPageView(path: string, title?: string) {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('config', GA_ID, {
      page_path: path,
      page_title: title ?? document.title,
    });
  }
}
