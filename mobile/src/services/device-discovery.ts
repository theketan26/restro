import * as Network from 'expo-network';
import { httpClient } from '../infrastructure/http/axios-client';

export interface DiscoveredDevice {
  id: string;
  name: string;
  master_name?: string;
  device_type: string;
  ip_address: string;
  port: number;
  version: string;
  base_url: string;
}

const DISCOVERY_PORT = process.env.EXPO_PUBLIC_API_BASE_PORT?.trim() || '2326';
const DISCOVERY_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const DISCOVERY_TIMEOUT = 3000; // 3 seconds per device check

function buildBaseUrl(ipAddress: string, port?: number | string): string {
  if (DISCOVERY_BASE_URL) {
    return DISCOVERY_BASE_URL.replace(/\/$/, '');
  }

  return `http://${ipAddress}:${port ?? DISCOVERY_PORT}`;
}

/**
 * Get the local IP address of the device
 */
export async function getLocalIpAddress(): Promise<string | null> {
  try {
    if (typeof Network.getIpAddressAsync === 'function') {
      const ip = await Network.getIpAddressAsync();
      return ip;
    }

    if (typeof Network.getNetworkStateAsync === 'function') {
      const state = await Network.getNetworkStateAsync();
      return (state as any)?.ipAddress ?? null;
    }
  } catch (error) {
    console.error('Error getting local IP:', error);
  }

  return null;
}

/**
 * Parse the local IP to get the network subnet
 * For example: 192.168.1.100 -> 192.168.1
 */
function getNetworkSubnet(ipAddress: string): string {
  const parts = ipAddress.split('.');
  if (parts.length === 4) {
    return parts.slice(0, 3).join('.');
  }
  return ipAddress;
}

/**
 * Try to connect to a single device on the network
 */
async function checkDevice(ipAddress: string): Promise<DiscoveredDevice | null> {
  const baseUrl = buildBaseUrl(ipAddress);
  const url = `${baseUrl}/api/device/info`;

  try {
    const response = await httpClient.get(url, {
      timeout: DISCOVERY_TIMEOUT,
    });

    if (response.data && response.data.data) {
      return {
        ...response.data.data,
        base_url: DISCOVERY_BASE_URL
          ? DISCOVERY_BASE_URL.replace(/\/$/, '')
          : buildBaseUrl(response.data.data.ip_address, response.data.data.port ?? DISCOVERY_PORT),
      };
    }
  } catch (error) {
    // Device not reachable or not a Stackrise device
  }

  return null;
}

/**
 * Scan the local network for Stackrise devices
 * This performs a quick scan of common IP addresses on the network
 */
export async function scanLocalNetwork(): Promise<DiscoveredDevice[]> {
  const localIp = await getLocalIpAddress();
  if (!localIp) {
    console.error('Could not determine local IP address');
    return [];
  }

  const subnet = getNetworkSubnet(localIp);
  const devices: DiscoveredDevice[] = [];

  // Common IP range to scan (1-254)
  // For faster discovery, we can scan in parallel
  const checkPromises = [];
  for (let i = 1; i <= 254; i++) {
    const ipAddress = `${subnet}.${i}`;
    checkPromises.push(checkDevice(ipAddress));
  }

  const results = await Promise.all(checkPromises);
  for (const device of results) {
    if (device) {
      devices.push(device);
    }
  }

  return devices;
}

/**
 * Scan with a specific IP address range (for faster/targeted scanning)
 */
export async function scanNetworkRange(
  startIp: number,
  endIp: number
): Promise<DiscoveredDevice[]> {
  const localIp = await getLocalIpAddress();
  if (!localIp) {
    return [];
  }

  const subnet = getNetworkSubnet(localIp);
  const devices: DiscoveredDevice[] = [];

  const checkPromises = [];
  for (let i = startIp; i <= endIp; i++) {
    const ipAddress = `${subnet}.${i}`;
    checkPromises.push(checkDevice(ipAddress));
  }

  const results = await Promise.all(checkPromises);
  for (const device of results) {
    if (device) {
      devices.push(device);
    }
  }

  return devices;
}

/**
 * Get device information from a full base URL
 */
export async function getDeviceInfoFromBaseUrl(
  baseUrl: string
): Promise<DiscoveredDevice | null> {
  try {
    const response = await httpClient.get(`${baseUrl}/api/device/info`, {
      timeout: DISCOVERY_TIMEOUT,
    });

    if (response.data && response.data.data) {
      return {
        ...response.data.data,
        base_url: DISCOVERY_BASE_URL
          ? DISCOVERY_BASE_URL.replace(/\/$/, '')
          : buildBaseUrl(response.data.data.ip_address, response.data.data.port ?? DISCOVERY_PORT),
      };
    }
  } catch (error) {
    // Device not reachable or not a Stackrise device
  }

  return null;
}

/**
 * Manually add a device by IP address
 */
export async function addDeviceByIp(ipAddress: string): Promise<DiscoveredDevice | null> {
  return checkDevice(ipAddress);
}
