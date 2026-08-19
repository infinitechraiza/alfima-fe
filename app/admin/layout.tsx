'use client';

import { AdminSidebar, AdminMobileTopbar } from '@/components/admin/AdminSidebar';
import { usePushNotification } from '@/hooks/usePushNotification';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  usePushNotification(); // 👈 registers SW + subscribes admin to push + badge

  return (
    <>
      <style>{`
        body { background: #f8fafc !important; }
        main { padding-top: 0 !important; min-height: unset !important; }
      `}</style>
      <div className="flex h-screen overflow-hidden bg-slate-50">

        <AdminSidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AdminMobileTopbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

      </div>
    </>
  );
}