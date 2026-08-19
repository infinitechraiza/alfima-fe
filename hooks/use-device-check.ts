/**
 * Hook to periodically check if the current device is still valid
 * Detects if device has been revoked/logged out
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';

const CHECK_INTERVAL = 30000; // Check every 30 seconds

export function useDeviceCheck() {
  const router = useRouter();
  const { user, isDeviceRevoked, setDeviceRevoked, fetchUser } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkDevice = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          // Device was revoked or session expired
          setDeviceRevoked(true);
          router.push('/login?reason=device_revoked');
          return;
        }

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (!data.user) {
          setDeviceRevoked(true);
          router.push('/login');
        }
      } catch (error) {
        console.error('[useDeviceCheck] error:', error);
      }
    };

    // Initial check
    checkDevice();

    // Set up periodic checks
    const interval = setInterval(checkDevice, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, router, setDeviceRevoked]);

  return { isDeviceRevoked };
}
