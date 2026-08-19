"use client";

import { create } from "zustand";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "agent" | "buyer";
  avatar: string | null;
  is_active: boolean;
  license_number: string | null;
  specialization: string | null;
  experience_years: number | null;
}

export interface Device {
  id: number;
  device_name: string;
  device_type: string;
  user_agent: string;
  ip_address: string;
  is_current: boolean;
  last_activity: string;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  currentDeviceId: string | null;
  isDeviceRevoked: boolean;
  devices: Device[];

  fetchUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  setCurrentDeviceId: (deviceId: string) => void;
  setDeviceRevoked: (revoked: boolean) => void;
  setDevices: (devices: Device[]) => void;
  fetchDevices: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  currentDeviceId: null,
  isDeviceRevoked: false,
  devices: [],

  fetchUser: async () => {
    // ✅ Only block if already loading — removed stale fetchPromise deduplication
    if (get().loading) return;

    set({ loading: true });

    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, initialized: true, loading: false });
      } else if (res.status === 401) {
        set({
          user: null,
          initialized: true,
          loading: false,
          isDeviceRevoked: true,
        });
      } else {
        set({ user: null, initialized: true, loading: false });
      }
    } catch (e) {
      console.error("[fetchUser] error:", e);
      set({ user: null, initialized: true, loading: false });
    }
  },

  setUser: (user) => set({ user, initialized: true, loading: false }),

  logout: async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    set({
      user: null,
      initialized: false,
      loading: false,
      currentDeviceId: null,
      devices: [],
      isDeviceRevoked: false,
    });
  },

  setCurrentDeviceId: (deviceId) => {
    set({ currentDeviceId: deviceId });
    if (typeof window !== "undefined") {
      localStorage.setItem("currentDeviceId", deviceId);
    }
  },

  setDeviceRevoked: (revoked) => set({ isDeviceRevoked: revoked }),

  setDevices: (devices) => set({ devices }),

  fetchDevices: async () => {
    try {
      const res = await fetch("/api/devices", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        set({ devices: data.devices || [] });
      }
    } catch (e) {
      console.error("[fetchDevices] error:", e);
    }
  },
}));
