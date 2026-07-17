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
import { connectToDevice, disconnectFromDevice, requestAuthAndConnect } from '../services/connection-service';

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
}

export function useDeviceConnection(): UseDeviceConnectionResult {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<DiscoveredDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = useCallback(async () => {
    const cached = await loadCachedAvailableDevices();
    setDevices(cached);

    const stored = await loadConnectedDevice();
    if (stored) {
      const fresh = await getDeviceInfoFromBaseUrl(stored.base_url);
      if (fresh) {
        setConnectedDevice(fresh);
        setDevices((prev) => {
          const exists = prev.some((device) => device.id === fresh.id);
          return exists ? prev : [...prev, fresh];
        });
      } else {
        await clearConnectedDevice();
      }
    }
  }, []);

  const scanDevices = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const discoveredDevices = await scanNetworkRange(1, 50);
      setDevices(discoveredDevices);
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
    // attempt to notify desktop and persist connection
    const connected = await connectToDevice(device);
    if (connected) {
      setConnectedDevice(device);
      await saveConnectedDevice(device);
    } else {
      setError('Failed to connect to device');
    }
  }, []);

  const requestConnect = useCallback(async (device: DiscoveredDevice, email: string) => {
    setError(null);
    try {
      const connected = await requestAuthAndConnect(device, email);
      if (connected) {
        setConnectedDevice(device);
        return true;
      } else {
        setError('Authentication denied or timed out');
        return false;
      }
    } catch (err) {
      console.log(err)
      const msg = err instanceof Error ? err.message : 'Failed to request connection';
      setError(msg);
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    // notify desktop if possible, then clear local state
    if (connectedDevice) {
      await disconnectFromDevice(connectedDevice).catch(() => {});
    }
    setConnectedDevice(null);
    await clearConnectedDevice();
  }, []);

  const addDevice = useCallback(async (ip: string) => {
    try {
      const device = await addDeviceByIp(ip);
      if (device) {
        setDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id);
          const updated = exists ? prev : [...prev, device];
          cacheAvailableDevices(updated).catch(() => {});
          return updated;
        });
      } else {
        setError(`No device found at ${ip}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to add device at ${ip}`);
    }
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
  };
}
