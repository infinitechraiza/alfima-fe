'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import AdminSettingsPage from '@/components/admin/AdminSettings';
import AgentSettingsPage from '../agent/settings/page';
import BuyerSettingsPage from '../buyer/settings/page';

export default function SettingsPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) {
      router.push('/login');
    }
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return null;
  }

  const getRoleSettings = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminSettingsPage />;
      case 'agent':
        return <AgentSettingsPage />;
      case 'buyer':
        return <BuyerSettingsPage />;
      default:
        return <AdminSettingsPage />;
    }
  };

  return getRoleSettings();
}
