import { useQuery } from '@tanstack/react-query';
import { getDeviceInfoFromBaseUrl, scanNetworkRange, type DiscoveredDevice } from '../../services/device-discovery';

export const DEVICE_DISCOVERY_QUERY_KEY = ['device-discovery'] as const;

async function fetchDiscoveredDevices(): Promise<DiscoveredDevice[]> {
  return scanNetworkRange(1, 50);
}

export function useDeviceDiscoveryQuery() {
  return useQuery({
    queryKey: DEVICE_DISCOVERY_QUERY_KEY,
    queryFn: fetchDiscoveredDevices,
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useDeviceInfoQuery(baseUrl: string | null) {
  return useQuery({
    queryKey: ['device-info', baseUrl],
    queryFn: () => (baseUrl ? getDeviceInfoFromBaseUrl(baseUrl) : null),
    enabled: Boolean(baseUrl),
    staleTime: 1000 * 30,
    retry: 1,
  });
}
