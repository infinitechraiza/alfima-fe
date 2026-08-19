'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchUser = useAuth(state => state.fetchUser);

  useEffect(() => {
    fetchUser(); // always fetch on mount/refresh, cookie is the source of truth
  }, []); // ← removed pathname dependency, only run once on mount

  return <>{children}</>;
}