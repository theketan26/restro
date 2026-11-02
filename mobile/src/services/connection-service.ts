import { httpClient } from '../infrastructure/http/axios-client';
import {
  DiscoveredDevice,
  getDeviceInfoFromBaseUrl,
} from './device-discovery';
import {
  clearConnectedDevice,
  getMobileDeviceInfo,
  loadConnectedDevice,
  saveConnectedDevice,
} from './connection-store';
import { saveJwtToken, loadJwtToken } from './connection-store';

const CONNECT_ENDPOINT = '/api/device/connect';

export async function connectToDevice(device: DiscoveredDevice): Promise<DiscoveredDevice | null> {
  try {
    const mobileInfo = await getMobileDeviceInfo();
    const token = await loadJwtToken();
    const headers: any = {};
    if (token) {
      headers['Cookie'] = `jwt=${token}`;
    }

    const response = await httpClient.post(`${device.base_url}${CONNECT_ENDPOINT}`, {
      mobile: {
        id: mobileInfo.id,
        name: mobileInfo.name,
        device_type: mobileInfo.device_type,
        ip_address: mobileInfo.ip_address,
        port: mobileInfo.port,
        version: mobileInfo.version,
        last_seen: new Date().toISOString(),
      },
    }, { headers });

    const responseData = response.data?.data;
    const updatedDevice: DiscoveredDevice = {
      ...device,
      user_name: responseData?.user_name || device.user_name,
      user_email: responseData?.user_email || device.user_email,
      user_role: responseData?.user_role || device.user_role,
    };

    await saveConnectedDevice(updatedDevice);
    return updatedDevice;
  } catch (error) {
    console.error('Error connecting to device:', error);
    return null;
  }
}

export async function disconnectFromDevice(device: DiscoveredDevice): Promise<boolean> {
  try {
    const mobileInfo = await getMobileDeviceInfo();
    const token = await loadJwtToken();
    const headers: any = {};
    if (token) {
      headers['Cookie'] = `jwt=${token}`;
    }

    await httpClient.post(`${device.base_url}${CONNECT_ENDPOINT.replace('/connect', '/disconnect')}`, {
      mobile: {
        id: mobileInfo.id,
        name: mobileInfo.name,
        device_type: mobileInfo.device_type,
        ip_address: mobileInfo.ip_address,
        port: mobileInfo.port,
        version: mobileInfo.version,
        last_seen: new Date().toISOString(),
      },
    }, { headers });

    await clearConnectedDevice();
    return true;
  } catch (error) {
    console.error('Error disconnecting from device:', error);
    return false;
  }
}

export async function reconnectSavedDevice(): Promise<DiscoveredDevice | null> {
  const stored = await loadConnectedDevice();
  if (!stored) {
    return null;
  }

  const refreshed = await getDeviceInfoFromBaseUrl(stored.base_url);
  if (!refreshed) {
    await clearConnectedDevice();
    return null;
  }

  const connected = await connectToDevice(refreshed);
  return connected;
}

export async function getConnectedDevice(): Promise<DiscoveredDevice | null> {
  return loadConnectedDevice();
}

export async function verifyStillConnected(device: DiscoveredDevice): Promise<boolean> {
  if (device.id === 'mock-device' || device.base_url?.startsWith('mock://')) {
    return true;
  }
  try {
    const mobileInfo = await getMobileDeviceInfo();
    const resp = await httpClient.get(`${device.base_url}/api/device/connected`, {
      timeout: 3000,
    });
    const payload = resp?.data;
    if (payload?.success && Array.isArray(payload?.data)) {
      return payload.data.some((d: any) => d.id === mobileInfo.id);
    }
    return false;
  } catch {
    return false;
  }
}

// Create an authentication request on the desktop (user must approve)
export async function createAuthRequest(device: DiscoveredDevice, email: string): Promise<string | null> {
  try {
    const mobileInfo = await getMobileDeviceInfo();
    const cleanEmail = email.trim().toLowerCase();
    const resp = await httpClient.post(`${device.base_url}/api/device/auth-request`, {
      mobile: {
        id: mobileInfo.id,
        name: mobileInfo.name,
        device_type: mobileInfo.device_type,
        ip_address: mobileInfo.ip_address,
        port: mobileInfo.port,
        version: mobileInfo.version,
        last_seen: new Date().toISOString(),
      },
      email: cleanEmail,
    }, {
      timeout: 10000,
    });

    return resp?.data?.data ?? null;
  } catch (err: any) {

    const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to create auth request';
    const networkMessage = err?.code === 'ERR_NETWORK' || err?.message === 'Network Error'
      ? 'Could not reach the desktop app over the local network. Make sure the desktop app is running and your phone is on the same Wi-Fi network.'
      : null;

    throw new Error(networkMessage || message);
  }
}

// Poll the auth request until approved and return token
export async function pollAuthRequestForToken(device: DiscoveredDevice, requestId: string, timeoutMs = 60000): Promise<string | null> {
  const start = Date.now();
  try {
    while (Date.now() - start < timeoutMs) {
      const resp = await httpClient.get(`${device.base_url}/api/device/auth-request/${requestId}`, {
        timeout: 10000,
      });
      const payload = resp?.data;
      if (payload?.success && payload?.data) {
        const req = payload.data as any;
        if (req.status === 'Approved' || req.status === 'Approved') {
          if (req.token) {
            return req.token as string;
          }
        }
        if (req.status === 'Denied') {
          return null;
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  } catch (err) {
    console.error('pollAuthRequestForToken error', err);
  }

  return null;
}

export async function requestAuthAndConnect(device: DiscoveredDevice, email: string): Promise<DiscoveredDevice | null> {
  const requestId = await createAuthRequest(device, email);
  if (!requestId) return null;

  const token = await pollAuthRequestForToken(device, requestId);
  if (!token) return null;

  // save token
  await saveJwtToken(token);

  // now attempt connect with token
  const connected = await connectToDevice(device);
  if (connected) {
    await saveConnectedDevice(device);
    return device;
  }

  return null;
}
