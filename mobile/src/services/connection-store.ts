import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { DiscoveredDevice } from './device-discovery';

const CONNECTION_KEY = 'stackrise.connectedDevice';
const DEVICE_CACHE_KEY = 'stackrise.availableDevices';
const MOBILE_DEVICE_ID_KEY = 'stackrise.mobileDeviceId';
const JWT_TOKEN_KEY = 'stackrise.jwtToken';

export async function saveConnectedDevice(device: DiscoveredDevice): Promise<void> {
  const payload = JSON.stringify(device);
  await SecureStore.setItemAsync(CONNECTION_KEY, payload, {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

export async function clearConnectedDevice(): Promise<void> {
  await SecureStore.deleteItemAsync(CONNECTION_KEY);
}

export async function loadConnectedDevice(): Promise<DiscoveredDevice | null> {
  const payload = await SecureStore.getItemAsync(CONNECTION_KEY);
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as DiscoveredDevice;
  } catch {
    return null;
  }
}

export async function updateStoredUserProfile(name: string, email: string): Promise<DiscoveredDevice | null> {
  const current = await loadConnectedDevice();
  if (!current) return null;

  const updated: DiscoveredDevice = {
    ...current,
    user_name: name,
    user_email: email,
  };
  await saveConnectedDevice(updated);
  return updated;
}

export async function cacheAvailableDevices(devices: DiscoveredDevice[]): Promise<void> {
  await AsyncStorage.setItem(DEVICE_CACHE_KEY, JSON.stringify(devices));
}

export async function loadCachedAvailableDevices(): Promise<DiscoveredDevice[]> {
  const payload = await AsyncStorage.getItem(DEVICE_CACHE_KEY);
  if (!payload) {
    return [];
  }

  try {
    return JSON.parse(payload) as DiscoveredDevice[];
  } catch {
    return [];
  }
}

export async function getMobileDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(MOBILE_DEVICE_ID_KEY);
  if (deviceId) {
    return deviceId;
  }

  deviceId = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(MOBILE_DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export async function getMobileDeviceInfo(): Promise<Omit<DiscoveredDevice, 'base_url'>> {
  const id = await getMobileDeviceId();
  const name = Device.modelName || Device.osName || 'Mobile Device';

  return {
    id,
    name,
    device_type: 'Mobile',
    ip_address: '0.0.0.0',
    port: 0,
    version: Device.osVersion || 'unknown',
  };
}

export async function saveJwtToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(JWT_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

export async function loadJwtToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(JWT_TOKEN_KEY);
}

export async function clearJwtToken(): Promise<void> {
  await SecureStore.deleteItemAsync(JWT_TOKEN_KEY);
}
