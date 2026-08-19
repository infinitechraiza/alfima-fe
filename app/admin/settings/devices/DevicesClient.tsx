'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useDeviceRevocation } from '@/hooks/use-device-revocation';
import { logoutDevice, logoutAllOthers } from '@/lib/api-client';
import Link from 'next/link';
import { Trash2, LogOut, Copy, Check } from 'lucide-react';

// Prevent static prerendering — this page requires auth context at runtime
export const dynamic = 'force-dynamic';

export default function DevicesPage() {
  const router = useRouter();
  const { token, deviceId, loadDevices, devices, isLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useDeviceRevocation();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.push('/login');
      return;
    }
    loadDevices(token);
  }, [mounted, token, deviceId, router, loadDevices]);

  async function handleLogoutDevice(deviceIdToRevoke: string) {
    if (!deviceId) return;
    setLoadingDeviceId(deviceIdToRevoke);
    setError(null);
    try {
      await logoutDevice(deviceIdToRevoke, deviceId);
      if (token) await loadDevices(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout device');
    } finally {
      setLoadingDeviceId(null);
    }
  }

  async function handleLogoutAllOthers() {
    if (!deviceId) return;
    setLogoutAllLoading(true);
    setError(null);
    try {
      await logoutAllOthers(deviceId);
      if (token) await loadDevices(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout other devices');
    } finally {
      setLogoutAllLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatDate(dateString?: string) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // Don't render anything until client-side mount (avoids prerender crash)
  if (!mounted) return null;

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">← Back to Dashboard</Button>
          </Link>
          <h1 className="text-3xl font-bold">Active Devices</h1>
          <p className="mt-2 text-muted-foreground">
            Manage devices that have access to your account. You can have up to 3 devices active at the same time.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading devices...</p>
              </CardContent>
            </Card>
          ) : devices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No active devices found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {devices.map((device) => (
                <Card key={device.id} className={device.is_current ? 'border-primary/50 bg-primary/5' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{device.name}</h3>
                          {device.is_current && (
                            <span className="inline-block rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                              This Device
                            </span>
                          )}
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                          <div><span className="font-medium text-foreground">Type:</span> {device.type}</div>
                          {device.ip_address && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">IP:</span>
                              <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{device.ip_address}</code>
                              <button onClick={() => copyToClipboard(device.ip_address || '')} className="p-1 hover:bg-muted" title="Copy IP">
                                {copiedId === device.ip_address ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                          <div><span className="font-medium text-foreground">Last Active:</span> {formatDate(device.last_activity_at)}</div>
                          <div><span className="font-medium text-foreground">Logged In:</span> {formatDate(device.created_at)}</div>
                        </div>
                      </div>
                      {!device.is_current && (
                        <Button
                          variant="destructive" size="sm"
                          onClick={() => handleLogoutDevice(device.id.toString())}
                          disabled={loadingDeviceId === device.id.toString() || isLoading}
                          className="gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {devices.length > 1 && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-900 dark:text-orange-100">
                      Logout from All Other Devices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      This will immediately log out your account from all other devices. You&apos;ll remain logged in on this device.
                    </p>
                    <Button variant="destructive" onClick={handleLogoutAllOthers} disabled={logoutAllLoading || isLoading} className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      {logoutAllLoading ? 'Logging out...' : 'Logout All Other Devices'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <Card className="mt-8 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-base text-blue-900 dark:text-blue-100">About Device Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• You can be logged in on a maximum of 3 devices at the same time</p>
            <p>• When you log in on a 4th device, your oldest active device will be automatically logged out</p>
            <p>• Each device is identified by a unique fingerprint based on browser and system information</p>
            <p>• You can manually log out any device from this page</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}