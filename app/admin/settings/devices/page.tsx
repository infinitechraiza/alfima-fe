'use client';

import dynamic from 'next/dynamic';

const DevicesClient = dynamic(() => import('./DevicesClient'), { ssr: false });

export default function DevicesPage() {
  return <DevicesClient />;
}