/**
 * Device fingerprinting and identification utilities
 */

export interface DeviceInfo {
  device_name: string;
  device_type: 'web' | 'mobile' | 'tablet' | 'desktop';
  user_agent: string;
}

/**
 * Get device type — must match Laravel enum: web | mobile | tablet | desktop
 */
function getDeviceType(userAgent: string): DeviceInfo['device_type'] {
  if (/ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone|ipod/i.test(userAgent)) return 'mobile';
  if (/Win|Mac|Linux|X11/i.test(userAgent)) return 'desktop';
  return 'web';
}

/**
 * Get browser name from user agent
 */
function getBrowserName(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Edge';               // Edge before Chrome check
  if (/OPR|Opera/i.test(userAgent)) return 'Opera';          // Opera before Chrome check
  if (/Chrome/i.test(userAgent) && !/Chromium/i.test(userAgent)) return 'Chrome';
  if (/Chromium/i.test(userAgent)) return 'Chromium';
  if (/Firefox/i.test(userAgent)) return 'Firefox';
  if (/Safari/i.test(userAgent)) return 'Safari';
  if (/MSIE|Trident/i.test(userAgent)) return 'IE';
  return 'Unknown';
}

/**
 * Get OS name from user agent
 */
function getOSName(userAgent: string): string {
  if (/iPhone|iPod/i.test(userAgent)) return 'iOS';
  if (/iPad/i.test(userAgent)) return 'iPadOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
}

/**
 * Get comprehensive device info
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  const browser = getBrowserName(userAgent);
  const os = getOSName(userAgent);
  const device_type = getDeviceType(userAgent);

  // e.g. "Chrome on Windows" or "Safari on iOS"
  const device_name = `${browser} on ${os}`;

  return {
    device_name,
    device_type,
    user_agent: userAgent,
  };
}

/**
 * Generate a STABLE device fingerprint based on fixed browser/hardware signals.
 * Does NOT use timestamp or random — same device always produces the same hash,
 * so the server can recognise a returning device instead of creating a new record.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const language  = typeof navigator !== 'undefined' ? navigator.language  : '';
  const timezone  = typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : '';
  const screen_res = typeof screen !== 'undefined'
    ? `${screen.width}x${screen.height}x${screen.colorDepth}`
    : '';
  const platform  = typeof navigator !== 'undefined' ? (navigator.platform ?? '') : '';

  // Stable string — same device, same values every time
  const raw = `${userAgent}|${language}|${timezone}|${screen_res}|${platform}`;

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const data      = new TextEncoder().encode(raw);
      const hashBuf   = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuf));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error('[generateDeviceFingerprint] SubtleCrypto failed:', e);
    }
  }

  // SSR / fallback — deterministic base64 slice
  return btoa(raw).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
}

/**
 * Store device ID in localStorage
 */
export function storeDeviceId(deviceId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('deviceId', deviceId);
  }
}

/**
 * Get stored device ID from localStorage
 */
export function getStoredDeviceId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('deviceId');
  }
  return null;
}

/**
 * Clear device ID from localStorage
 */
export function clearDeviceId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('deviceId');
  }
}