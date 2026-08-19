/**
 * API Client with device validation and revocation handling
 */

// Use internal Next.js API routes by default
export const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error_code?: string;
}

/**
 * Custom fetch wrapper with device validation
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit & { deviceId?: string } = {}
): Promise<T> {
  const { deviceId, ...fetchOptions } = options;
  
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(fetchOptions.headers || {});

  // Add authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add device ID header if provided
  if (deviceId) {
    headers.set('X-Device-ID', deviceId);
  }

  // Add content type if not already set
  if (!headers.has('Content-Type') && fetchOptions.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle device revocation
    if (response.status === 401) {
      const errorData = await response.json();
      
      if (errorData.error_code === 'DEVICE_REVOKED') {
        // Clear auth data and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('device_id');
        localStorage.removeItem('device_name');
        localStorage.removeItem('device_fingerprint');

        // Trigger event for components to listen to
        window.dispatchEvent(
          new CustomEvent('device-revoked', {
            detail: { message: errorData.message },
          })
        );

        throw new Error('DEVICE_REVOKED');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Login API call
 */
export async function login(
  email: string,
  password: string,
  deviceFingerprint: string,
  deviceName: string,
  deviceType: 'web' | 'mobile' | 'tablet' | 'desktop'
): Promise<{
  token: string;
  device_id: number;
  user: any;
}> {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      device_fingerprint: deviceFingerprint,
      device_name: deviceName,
      device_type: deviceType,
    }),
  });

  return response;
}

/**
 * Register API call
 */
export async function register(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
  deviceFingerprint: string,
  deviceName: string,
  deviceType: 'web' | 'mobile' | 'tablet' | 'desktop'
): Promise<{
  token: string;
  device_id: number;
  user: any;
}> {
  const response = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      device_fingerprint: deviceFingerprint,
      device_name: deviceName,
      device_type: deviceType,
    }),
  });

  return response;
}

/**
 * Logout API call
 */
export async function logout(deviceId: string): Promise<any> {
  const response = await apiCall(
    '/auth/logout',
    {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId }),
      deviceId,
    }
  );

  return response;
}

/**
 * Get all devices
 */
export async function getDevices(deviceId: string): Promise<{
  devices: any[];
  total_devices: number;
}> {
  const response = await apiCall(`/devices?current_device_id=${deviceId}`, {
    deviceId,
  });

  return response;
}

/**
 * Logout from a specific device
 */
export async function logoutDevice(
  deviceIdToRevoke: string,
  currentDeviceId: string
): Promise<any> {
  const response = await apiCall(
    `/devices/${deviceIdToRevoke}/logout`,
    {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceIdToRevoke }),
      deviceId: currentDeviceId,
    }
  );

  return response;
}

/**
 * Logout from all other devices
 */
export async function logoutAllOthers(currentDeviceId: string): Promise<any> {
  const response = await apiCall(
    '/devices/logout-all-others',
    {
      method: 'POST',
      body: JSON.stringify({ current_device_id: currentDeviceId }),
      deviceId: currentDeviceId,
    }
  );

  return response;
}

/**
 * Rename a device
 */
export async function renameDevice(
  deviceId: string,
  newName: string,
  currentDeviceId: string
): Promise<any> {
  const response = await apiCall(
    `/devices/${deviceId}/rename`,
    {
      method: 'PUT',
      body: JSON.stringify({ device_id: deviceId, device_name: newName }),
      deviceId: currentDeviceId,
    }
  );

  return response;
}
