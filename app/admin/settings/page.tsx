'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/store'
import AdminSettingsPage from '@/components/admin/AdminSettings'
import AgentSettingsPage from '@/components/agent/AgentSettings'


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
            default:
                return <AdminSettingsPage />;
        }
    };

    return getRoleSettings();
}
