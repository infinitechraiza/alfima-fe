'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Smartphone, X, LogOut } from 'lucide-react';
import { Device } from '@/lib/store';

export default function DeviceManagement() {
  const { devices, fetchDevices, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        await fetchDevices();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [fetchDevices]);

  const handleRevokeDevice = async (deviceId: number) => {
    if (!confirm('Are you sure you want to logout this device?')) return;

    setRevoking(deviceId);
    try {
      const response = await fetch('/api/devices', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke device');
      }

      // Refresh devices list
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke device');
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutOthers = async () => {
    if (!confirm('This will logout all other devices. Continue?')) return;

    setLoggingOutOthers(true);
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout_others' }),
      });

      if (!response.ok) {
        throw new Error('Failed to logout other devices');
      }

      // Refresh devices list
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout other devices');
    } finally {
      setLoggingOutOthers(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Active Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading devices...
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDeviceId = localStorage.getItem('deviceId');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Active Devices ({devices.length}/3)
        </CardTitle>
        <CardDescription>
          You can have up to 3 devices logged in at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {devices.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No active devices
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device: Device) => {
              const isCurrent = device.id.toString() === currentDeviceId;
              const lastActivity = new Date(device.last_activity);
              const now = new Date();
              const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / 60000);

              let timeAgo = '';
              if (diffMinutes < 1) timeAgo = 'Just now';
              else if (diffMinutes < 60) timeAgo = `${diffMinutes}m ago`;
              else if (diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)}h ago`;
              else timeAgo = `${Math.floor(diffMinutes / 1440)}d ago`;

              return (
                <div
                  key={device.id}
                  className={`flex items-start justify-between rounded-lg border p-4 ${
                    isCurrent ? 'bg-accent border-primary' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{device.device_name}</h3>
                      {isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {device.device_type} • Last active {timeAgo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      IP: {device.ip_address}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeDevice(device.id)}
                      disabled={revoking === device.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {revoking === device.id ? (
                        <>Revoking...</>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Logout
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {devices.length > 1 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleLogoutOthers}
            disabled={loggingOutOthers}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {loggingOutOthers ? 'Logging out...' : 'Logout All Other Devices'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
