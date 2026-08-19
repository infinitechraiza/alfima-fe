'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Device {
  id: number;
  name: string;
  type: 'web' | 'mobile' | 'tablet' | 'desktop';
  ip_address?: string;
  user_agent?: string;
  last_activity_at?: string;
  created_at?: string;
  is_current?: boolean;
}

export interface AuthContextType {
  token: string | null;
  deviceId: string | null;
  deviceName: string | null;
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  
  setToken: (token: string | null) => void;
  setDeviceId: (id: string | null) => void;
  setDevices: (devices: Device[]) => void;
  setError: (error: string | null) => void;
  
  handleDeviceRevoked: () => void;
  loadDevices: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedDeviceId = localStorage.getItem('device_id');
    const storedDeviceName = localStorage.getItem('device_name');

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    }
    if (storedDeviceName) {
      setDeviceName(storedDeviceName);
    }
  }, []);

  const loadDevices = useCallback(async (authToken: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/devices', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Device-ID': deviceId || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load devices');
      }

      const data = await response.json();
      setDevices(data.devices || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load devices';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  const handleDeviceRevoked = useCallback(() => {
    // Clear auth data when device is revoked
    localStorage.removeItem('auth_token');
    localStorage.removeItem('device_id');
    localStorage.removeItem('device_name');
    localStorage.removeItem('device_fingerprint');
    
    setToken(null);
    setDeviceId(null);
    setDeviceName(null);
    setDevices([]);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        deviceId,
        deviceName,
        devices,
        isLoading,
        error,
        setToken,
        setDeviceId,
        setDevices,
        setError,
        handleDeviceRevoked,
        loadDevices,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
