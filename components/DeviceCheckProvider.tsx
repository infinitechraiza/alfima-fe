'use client';

import { useDeviceCheck } from '@/hooks/use-device-check';

export default function DeviceCheckProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useDeviceCheck();

  return <>{children}</>;
}
