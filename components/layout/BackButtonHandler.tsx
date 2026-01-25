'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Prevents the phone's back button from kicking the user out of the app.
 * Also registers the PWA service worker.
 */
export function BackButtonHandler() {
  const pathname = usePathname();
  const guardPushed = useRef(false);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silently fail - SW is optional
      });
    }
  }, []);

  useEffect(() => {
    // Skip for the signing page (external users)
    if (pathname.startsWith('/sign')) {
      return;
    }

    // Push a guard state on each new page
    if (!guardPushed.current) {
      window.history.pushState(
        { guard: true, path: pathname },
        '',
        window.location.href
      );
      guardPushed.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      // Don't interfere with modal/sheet state
      if (event.state?.sheetOpen || event.state?.dialogOpen) {
        return;
      }

      // Re-push guard to prevent exit
      window.history.pushState(
        { guard: true, path: pathname },
        '',
        window.location.href
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pathname]);

  // Reset guard flag on navigation
  useEffect(() => {
    guardPushed.current = false;
  }, [pathname]);

  return null;
}
