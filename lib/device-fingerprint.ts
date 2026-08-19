/**
 * Generate a unique device fingerprint based on device information
 * This is a client-side hash that helps identify the device
 */

export interface DeviceInfo {
  fingerprint: string;
  name: string;
  type: 'web' | 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

/**
 * Generate a SHA-256 hash of device data
 */
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get device type based on user agent
 */
function getDeviceType(userAgent: string): 'web' | 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  
  if (/mobile|android|iphone|windows phone/i.test(ua)) {
    return 'mobile';
  }
  if (/ipad|tablet|kindle/i.test(ua)) {
    return 'tablet';
  }
  
  return 'web';
}

/**
 * Get human-readable device name
 */
function getDeviceName(userAgent: string): string {
  // Try to extract browser and OS from user agent
  let browserName = 'Unknown Browser';
  let osName = 'Unknown OS';

  // Detect browser
  if (/firefox/i.test(userAgent)) {
    browserName = 'Firefox';
  } else if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
    browserName = 'Chrome';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browserName = 'Safari';
  } else if (/edge|edg/i.test(userAgent)) {
    browserName = 'Edge';
  } else if (/opera|opr/i.test(userAgent)) {
    browserName = 'Opera';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    osName = 'Windows';
  } else if (/macos|macintosh/i.test(userAgent)) {
    osName = 'macOS';
  } else if (/linux/i.test(userAgent)) {
    osName = 'Linux';
  } else if (/iphone/i.test(userAgent)) {
    osName = 'iOS';
  } else if (/android/i.test(userAgent)) {
    osName = 'Android';
  }

  return `${browserName} on ${osName}`;
}

/**
 * Generate device fingerprint and info
 */
export async function generateDeviceFingerprint(): Promise<DeviceInfo> {
  if (typeof window === 'undefined') {
    throw new Error('Device fingerprinting must be done in browser context');
  }

  const userAgent = navigator.userAgent;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;

  // Combine device characteristics
  const deviceData = `${userAgent}|${screenResolution}|${timezone}|${language}`;
  const fingerprint = await hashData(deviceData);

  return {
    fingerprint,
    name: getDeviceName(userAgent),
    type: getDeviceType(userAgent),
    userAgent,
  };
}

/**
 * Get stored device fingerprint from localStorage
 */
export function getStoredFingerprint(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('device_fingerprint');
}

/**
 * Store device fingerprint in localStorage
 */
export function storeFingerprint(fingerprint: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('device_fingerprint', fingerprint);
}

/**
 * Clear stored fingerprint
 */
export function clearFingerprint(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('device_fingerprint');
}
