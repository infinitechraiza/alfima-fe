'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook to handle device revocation events
 * Listens for device-revoked custom events and redirects to login
 */
export function useDeviceRevocation() {
  const router = useRouter();
  const { handleDeviceRevoked } = useAuth();

  useEffect(() => {
    const handleRevocation = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[Device Revoked]', customEvent.detail?.message);

      // Clear auth data
      handleDeviceRevoked();

      // Redirect to login
      router.push('/login?revoked=true');
    };

    // Listen for device revocation events
    window.addEventListener('device-revoked', handleRevocation);

    return () => {
      window.removeEventListener('device-revoked', handleRevocation);
    };
  }, [router, handleDeviceRevoked]);
}

/**
 * Hook to add device ID header to all API requests
 */
export function useAddDeviceIdToRequests() {
  useEffect(() => {
    // Intercept fetch calls to add device ID
    const originalFetch = window.fetch;

    window.fetch = function (...args) {
      const [resource, config] = args;
      const deviceId = localStorage.getItem('device_id');

      if (deviceId && config && typeof config === 'object' && !('deviceId' in config)) {
        const headers = new Headers(config.headers);
        headers.set('X-Device-ID', deviceId);
        config.headers = headers;
      }

      return originalFetch.apply(window, args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);
}
