'use client';

import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import MediaPanel from './MediaPanel';

export default function AgentMediaPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
    if (initialized && user && user.role !== 'agent') router.replace('/');
  }, [user, initialized, router]);

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#3D1A1A 0%,#7A2525 50%,#1A0A0A 100%)' }}>
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <MediaPanel userId={user.id} />
    </div>
  );
}
