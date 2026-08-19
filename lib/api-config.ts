// lib/api-config.ts

const NEXT_API = ''; // relative = same origin (Next.js proxy routes)
const BACKEND_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000';

// Helper to get auth token from cookies (client-side)
export const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='))
      ?.split('=')[1] ?? null
  );
};

// Helper to build fetch headers with auth token
export const authHeaders = (extra?: HeadersInit): HeadersInit => {
  const token = getAuthToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

export const API_CONFIG = {
  baseURL: BACKEND_URL,

  developers: {
    // ── Proxied through Next.js (token handled via cookie) ──
    list:   () => `${NEXT_API}/api/admin/developers-properties`,
    create: () => `${NEXT_API}/api/admin/developers-properties`,
    get:    (id: string | number) => `${NEXT_API}/api/admin/developers-properties/${id}`,
    update: (id: string | number) => `${NEXT_API}/api/admin/developers-properties/${id}`,
    delete: (id: string | number) => `${NEXT_API}/api/admin/developers-properties/${id}`,

    // ── Direct to Laravel backend (token injected via authHeaders) ──
    // Used for large file uploads to bypass Vercel's 4 MB body limit
    imageUpload: (id: string | number) =>
      `${BACKEND_URL}/api/admin/developers-properties/${id}/images`,
    imageDelete: (id: string | number, imageId: string | number) =>
      `${BACKEND_URL}/api/admin/developers-properties/${id}/images/${imageId}`,
    imageReorder: (id: string | number) =>
      `${BACKEND_URL}/api/admin/developers-properties/${id}/images/reorder`,

    videoUpload: (id: string | number) =>
      `${BACKEND_URL}/api/admin/developers-properties/${id}/videos`,
    videoDelete: (id: string | number, videoId: string | number) =>
      `${BACKEND_URL}/api/admin/developers-properties/${id}/videos/${videoId}`,
  },
};

export default API_CONFIG;