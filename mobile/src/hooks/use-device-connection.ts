import { useCallback, useEffect, useState } from 'react';
import {
  addDeviceByIp,
  DiscoveredDevice,
  getDeviceInfoFromBaseUrl,
  scanNetworkRange,
} from '../services/device-discovery';
import {
  cacheAvailableDevices,
  loadCachedAvailableDevices,
  loadConnectedDevice,
  saveConnectedDevice,
  clearConnectedDevice,
} from '../services/connection-store';
import { connectToDevice, disconnectFromDevice, requestAuthAndConnect, verifyStillConnected } from '../services/connection-service';

export interface UseDeviceConnectionResult {
  devices: DiscoveredDevice[];
  connectedDevice: DiscoveredDevice | null;
  isScanning: boolean;
  error: string | null;
  selectDevice: (device: DiscoveredDevice) => Promise<void>;
  requestConnect: (device: DiscoveredDevice, email: string) => Promise<boolean>;
  scanDevices: () => Promise<void>;
  disconnect: () => Promise<void>;
  addDevice: (ip: string) => Promise<void>;
  connectMock: () => Promise<void>;
}

// Module-level global state to synchronize hook instances across components
let globalConnectedDevice: DiscoveredDevice | null = null;
let globalConnectedDeviceLoaded = false;
const connectedDeviceListeners = new Set<(device: DiscoveredDevice | null) => void>();

let globalDevices: DiscoveredDevice[] = [];
const devicesListeners = new Set<(devices: DiscoveredDevice[]) => void>();

function updateConnectedDevice(device: DiscoveredDevice | null) {
  globalConnectedDevice = device;
  globalConnectedDeviceLoaded = true;
  connectedDeviceListeners.forEach((lis) => lis(device));
}

function updateDevices(devices: DiscoveredDevice[]) {
  globalDevices = devices;
  devicesListeners.forEach((lis) => lis(devices));
}

export function useDeviceConnection(): UseDeviceConnectionResult {
  const [devices, setDevices] = useState<DiscoveredDevice[]>(globalDevices);
  const [connectedDevice, setConnectedDevice] = useState<DiscoveredDevice | null>(globalConnectedDevice);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    connectedDeviceListeners.add(setConnectedDevice);
    devicesListeners.add(setDevices);
    return () => {
      connectedDeviceListeners.delete(setConnectedDevice);
      devicesListeners.delete(setDevices);
    };
  }, []);

  const loadState = useCallback(async () => {
    const cached = await loadCachedAvailableDevices();
    updateDevices(cached);

    const stored = await loadConnectedDevice();
    if (stored) {
      if (stored.id === 'mock-device' || stored.base_url?.startsWith('mock://')) {
        updateConnectedDevice(stored);
        updateDevices(globalDevices.some((d) => d.id === stored.id) ? globalDevices : [...globalDevices, stored]);
        return;
      }
      const fresh = await getDeviceInfoFromBaseUrl(stored.base_url);
      const isConnected = fresh ? await verifyStillConnected(stored) : false;
      if (fresh && isConnected) {
        const merged: DiscoveredDevice = {
          ...fresh,
          user_name: stored.user_name,
          user_email: stored.user_email,
          user_role: stored.user_role,
        };
        updateConnectedDevice(merged);
        updateDevices(globalDevices.some((device) => device.id === fresh.id) ? globalDevices : [...globalDevices, merged]);
      } else {
        await clearConnectedDevice();
        updateConnectedDevice(null);
      }
    } else {
      globalConnectedDeviceLoaded = true;
    }
  }, []);

  useEffect(() => {
    if (!globalConnectedDeviceLoaded) {
      loadState();
    }
  }, [loadState]);

  // Monitor connection status periodically when connected to a device
  useEffect(() => {
    if (!connectedDevice) return;

    const interval = setInterval(async () => {
      if (connectedDevice.id === 'mock-device' || connectedDevice.base_url?.startsWith('mock://')) {
        return;
      }
      const stillConnected = await verifyStillConnected(connectedDevice);
      if (!stillConnected) {
        await clearConnectedDevice();
        updateConnectedDevice(null);
        setError('Disconnected from desktop device');
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [connectedDevice]);

  const scanDevices = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const discoveredDevices = await scanNetworkRange(1, 50);
      updateDevices(discoveredDevices);
      await cacheAvailableDevices(discoveredDevices);
      if (discoveredDevices.length === 0) {
        setError('No devices found. Try adding manually or expanding the search.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan network');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const selectDevice = useCallback(async (device: DiscoveredDevice) => {
    const connected = await connectToDevice(device);
    if (connected) {
      updateConnectedDevice(connected);
      await saveConnectedDevice(connected);
    } else {
      setError('Failed to connect to device');
    }
  }, []);

  const requestConnect = useCallback(async (device: DiscoveredDevice, email: string) => {
    setError(null);
    try {
      const connected = await requestAuthAndConnect(device, email);
      if (connected) {
        updateConnectedDevice(connected);
        return true;
      } else {
        setError('Authentication denied or timed out');
        return false;
      }
    } catch (err) {
      console.log(err);
      const msg = err instanceof Error ? err.message : 'Failed to request connection';
      setError(msg);
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    const target = connectedDevice || (await loadConnectedDevice());
    if (target) {
      if (target.id !== 'mock-device' && !target.base_url?.startsWith('mock://')) {
        await disconnectFromDevice(target).catch(() => {});
      }
    }
    updateConnectedDevice(null);
    await clearConnectedDevice();
  }, [connectedDevice]);

  const addDevice = useCallback(async (ip: string) => {
    try {
      const device = await addDeviceByIp(ip);
      if (device) {
        const exists = globalDevices.some((d) => d.id === device.id);
        if (!exists) {
          const updated = [...globalDevices, device];
          updateDevices(updated);
          cacheAvailableDevices(updated).catch(() => {});
        }
      } else {
        setError(`No device found at ${ip}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to add device at ${ip}`);
    }
  }, []);

  const connectMock = useCallback(async () => {
    const mockDevice: DiscoveredDevice = {
      id: 'mock-device',
      name: 'Mock Desktop Device',
      master_name: 'Mock Desktop',
      device_type: 'Desktop',
      ip_address: '127.0.0.1',
      port: 8000,
      version: '1.0.0',
      base_url: 'mock://127.0.0.1:8000',
      user_name: 'Mock Admin User',
      user_email: 'admin@stackrise.local',
      user_role: 'admin',
    };
    updateConnectedDevice(mockDevice);
    await saveConnectedDevice(mockDevice);
  }, []);

  return {
    devices,
    connectedDevice,
    isScanning,
    error,
    selectDevice,
    requestConnect,
    scanDevices,
    disconnect,
    addDevice,
    connectMock,
  };
}
