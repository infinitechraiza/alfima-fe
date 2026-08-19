'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/store';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DeviceRevokedAlert() {
  const { isDeviceRevoked } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isDeviceRevoked) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-2">
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">Device Revoked</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This device was logged out from another location.
              </p>
              <div className="mt-4">
                <Link href="/login">
                  <Button size="sm" variant="default">
                    Login Again
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
