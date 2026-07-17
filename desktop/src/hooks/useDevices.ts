import { DeviceInfo } from "@/types/deviceInfo";
import { useEffect, useState } from "react";

export function useNetwork() {
  const DISCOVERY_PORT = process.env.NEXT_PUBLIC_API_BASE_PORT || "2326";
  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}:${DISCOVERY_PORT}`;
  const REQUEST_TIMEOUT = 2500;
  
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [authRequests, setAuthRequests] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [liveSyncActive, setLiveSyncActive] = useState<boolean>(false);
  const [liveSyncInterval, setLiveSyncInterval] = useState<NodeJS.Timeout | null>(null);

  async function fetchWithTimeout(input: RequestInfo, timeout: number) {
    const controller = new AbortController();
    const id = window.setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, { signal: controller.signal });
      return response;
    } finally {
      window.clearTimeout(id);
    }
  }

  
  const loadAuthRequests = async () => {
    try {
      const resp = await fetchWithTimeout(`${API_BASE_URL}/api/device/auth-requests`, REQUEST_TIMEOUT);
      if (!resp.ok) return;
      const payload = await resp.json();
      if (payload?.success && payload?.data) {
        const pending = (payload.data as any[]).filter((r) => r.status === 'Pending' || r.status === 'pending');
        setAuthRequests(pending);
        if (pending.length > 0) {
          setActiveRequest(pending[0]);
          setShowAuthModal(true);
        } else {
          setActiveRequest(null);
          setShowAuthModal(false);
        }
      }
    } catch {
      // ignore
    }
  };
  
  const approveRequest = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/device/auth-request/${id}/approve`, { method: 'POST' });
      if (resp.ok) {
        await loadAuthRequests();
        await loadConnectedDevices();
        setShowAuthModal(false);
        setActiveRequest(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const denyRequest = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/device/auth-request/${id}/deny`, { method: 'POST' });
      if (resp.ok) {
        await loadAuthRequests();
        setShowAuthModal(false);
        setActiveRequest(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConnectedDevices = async () => {
    setDevices([]);
    setError(null);
    setIsScanning(true);

    try {
      const resp = await fetchWithTimeout(
        `${API_BASE_URL}/api/device/connected`,
        REQUEST_TIMEOUT
      );

      if (!resp.ok) {
        throw new Error('Failed to fetch connected devices');
      }

      const payload = await resp.json();
      if (payload?.success && payload?.data) {
        setDevices(payload.data as DeviceInfo[]);
      } else {
        setError('No connected devices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connected devices.');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleLiveSync = () => {
    if (liveSyncActive && liveSyncInterval) {
      setLiveSyncActive(false);
      setLiveSyncInterval(null);
    } else {
      const interval = setInterval(() => {
        loadAuthRequests();
        loadConnectedDevices();
      }, 5000)
      setLiveSyncActive(true);
      setLiveSyncInterval(interval);
    }
  }

  useEffect(() => {
    toggleLiveSync();
  }, []);

  return {
    authRequests,
    activeRequest,
    showAuthModal,
    devices,
    isScanning,
    error,
    localIp,
    liveSyncActive,
    toggleLiveSync,
    approveRequest,
    denyRequest,
  }
}