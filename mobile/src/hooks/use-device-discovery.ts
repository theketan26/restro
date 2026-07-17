import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDeviceDiscoveryQuery } from '../queries/device/use-device-discovery-query';
import {
  addDeviceByIp,
  getLocalIpAddress,
  DiscoveredDevice,
} from '../services/device-discovery';

export interface UseDeviceDiscoveryResult {
  devices: DiscoveredDevice[];
  isScanning: boolean;
  error: string | null;
  localIp: string | null;
  startScan: () => Promise<void>;
  addDevice: (ip: string) => Promise<void>;
  clearError: () => void;
  removeDevice: (deviceId: string) => void;
}

/**
 * Hook for discovering devices on the local network
 */
export function useDeviceDiscovery(): UseDeviceDiscoveryResult {
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [manualError, setManualError] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useDeviceDiscoveryQuery();

  useEffect(() => {
    getLocalIpAddress().then(setLocalIp);
  }, []);

  useEffect(() => {
    if (data) {
      setDevices(data);
      setManualError(null);
    }
  }, [data]);

  const startScan = useCallback(async () => {
    setManualError(null);
    await refetch();
  }, [refetch]);

  const addDevice = useCallback(async (ip: string) => {
    try {
      const device = await addDeviceByIp(ip);
      if (device) {
        setDevices((prev) => {
          const exists = prev.some((d) => d.id === device.id);
          return exists ? prev : [...prev, device];
        });
      } else {
        setManualError(`No device found at ${ip}`);
      }
    } catch (err) {
      setManualError(
        err instanceof Error ? err.message : `Failed to add device at ${ip}`
      );
    }
  }, []);

  const clearError = useCallback(() => {
    setManualError(null);
  }, []);

  const removeDevice = useCallback((deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  }, []);

  const queryError = useMemo(() => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return null;
  }, [error]);

  return {
    devices,
    isScanning: isLoading || isFetching,
    error: manualError ?? queryError,
    localIp,
    startScan,
    addDevice,
    clearError,
    removeDevice,
  };
}
