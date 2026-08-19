'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DeviceRevocationAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleRevocation = (event: Event) => {
      const customEvent = event as CustomEvent;
      setMessage(customEvent.detail?.message || 'Your device has been logged out');
      setShowAlert(true);

      // Hide alert after 10 seconds
      setTimeout(() => setShowAlert(false), 10000);
    };

    window.addEventListener('device-revoked', handleRevocation);

    return () => {
      window.removeEventListener('device-revoked', handleRevocation);
    };
  }, []);

  if (!showAlert) return null;

  return (
    <Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Device Logged Out</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
