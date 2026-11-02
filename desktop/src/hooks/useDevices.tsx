"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { DeviceInfo } from "@/types/deviceInfo";
import Modal from "@/components/Modal";
import { Button } from "@/components/Button";
import { showToast } from "@/components/Toast";

export interface AuthRequest {
  id: string;
  email?: string;
  status: string;
  mobile: {
    name: string;
    ip_address: string;
    port: number | string;
    device_id?: string;
  };
}

interface DevicesContextType {
  devices: DeviceInfo[];
  authRequests: AuthRequest[];
  activeRequest: AuthRequest | null;
  showAuthModal: boolean;
  isScanning: boolean;
  error: string | null;
  localIp: string | null;
  liveSyncActive: boolean;
  setShowAuthModal: (show: boolean) => void;
  setActiveRequest: (req: AuthRequest | null) => void;
  toggleLiveSync: () => void;
  approveRequest: (id: string) => Promise<void>;
  denyRequest: (id: string) => Promise<void>;
  disconnectDevice: (id: string) => Promise<void>;
  loadAuthRequests: () => Promise<void>;
  loadConnectedDevices: () => Promise<void>;
  loadDeviceInfo: () => Promise<void>;
}

const DevicesContext = createContext<DevicesContextType | undefined>(undefined);

const DISCOVERY_PORT = process.env.NEXT_PUBLIC_API_BASE_PORT || "2326";
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost"}:${DISCOVERY_PORT}`;
const REQUEST_TIMEOUT = 2500;

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

export function DevicesProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [authRequests, setAuthRequests] = useState<AuthRequest[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState<AuthRequest | null>(null);
  const [liveSyncActive, setLiveSyncActive] = useState<boolean>(true);

  const prevDevicesRef = useRef<DeviceInfo[]>([]);

  const loadDeviceInfo = useCallback(async () => {
    try {
      const resp = await fetchWithTimeout(`${API_BASE_URL}/api/device/info`, REQUEST_TIMEOUT);
      if (!resp.ok) return;
      const payload = await resp.json();
      if (payload?.success && payload?.data?.ip_address) {
        setLocalIp(payload.data.ip_address);
      }
    } catch {
      // ignore
    }
  }, [API_BASE_URL]);

  const loadAuthRequests = useCallback(async () => {
    try {
      const resp = await fetchWithTimeout(`${API_BASE_URL}/api/device/auth-requests`, REQUEST_TIMEOUT);
      if (!resp.ok) return;
      const payload = await resp.json();
      if (payload?.success && payload?.data) {
        const pending = (payload.data as AuthRequest[]).filter(
          (r) => r.status?.toLowerCase() === "pending"
        );
        setAuthRequests(pending);
        if (pending.length > 0) {
          setActiveRequest((prev) => {
            const isStillPending = prev && pending.some((r) => r.id === prev.id);
            if (!isStillPending) {
              setShowAuthModal(true);
              return pending[0];
            }
            return prev;
          });
        } else {
          setActiveRequest(null);
          setShowAuthModal(false);
        }
      }
    } catch {
      // ignore network glitches
    }
  }, [API_BASE_URL]);

  const loadConnectedDevices = useCallback(async () => {
    setIsScanning(true);
    setError(null);

    try {
      const resp = await fetchWithTimeout(
        `${API_BASE_URL}/api/device/connected`,
        REQUEST_TIMEOUT
      );

      if (!resp.ok) {
        throw new Error("Failed to fetch connected devices");
      }

      const payload = await resp.json();
      if (payload?.success && payload?.data) {
        const nextDevices = payload.data as DeviceInfo[];
        // Check for devices that disconnected
        const prevDevices = prevDevicesRef.current;
        if (prevDevices.length > 0) {
          for (const d of prevDevices) {
            if (!nextDevices.some((nd) => nd.id === d.id)) {
              showToast(`Device "${d.user_name || d.master_name || d.name}" has disconnected`, {
                variant: "error",
              });
            }
          }
        }
        prevDevicesRef.current = nextDevices;
        setDevices(nextDevices);
      } else {
        setError("No connected devices");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load connected devices.");
    } finally {
      setIsScanning(false);
    }
  }, [API_BASE_URL]);

  const approveRequest = useCallback(async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/device/auth-request/${id}/approve`, { method: "POST" });
      if (resp.ok) {
        setShowAuthModal(false);
        setActiveRequest(null);
        await loadAuthRequests();
        await loadConnectedDevices();
      }
    } catch (e) {
      console.error("Failed to approve request:", e);
    }
  }, [API_BASE_URL, loadAuthRequests, loadConnectedDevices]);

  const denyRequest = useCallback(async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/device/auth-request/${id}/deny`, { method: "POST" });
      if (resp.ok) {
        setShowAuthModal(false);
        setActiveRequest(null);
        await loadAuthRequests();
      }
    } catch (e) {
      console.error("Failed to deny request:", e);
    }
  }, [API_BASE_URL, loadAuthRequests]);

  const disconnectDevice = useCallback(async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/device/connected/${id}/disconnect`, { method: "POST" });
      if (resp.ok) {
        await loadConnectedDevices();
      }
    } catch (e) {
      console.error("Failed to disconnect device:", e);
    }
  }, [API_BASE_URL, loadConnectedDevices]);

  const toggleLiveSync = useCallback(() => {
    setLiveSyncActive((prev) => !prev);
  }, []);

  // Poll for requests and devices every 5s if live sync is active
  useEffect(() => {
    // Initial fetch
    loadDeviceInfo();
    loadAuthRequests();
    loadConnectedDevices();

    if (!liveSyncActive) return;

    const interval = setInterval(() => {
      loadAuthRequests();
      loadConnectedDevices();
    }, 5000);

    return () => clearInterval(interval);
  }, [liveSyncActive, loadDeviceInfo, loadAuthRequests, loadConnectedDevices]);

  return (
    <DevicesContext.Provider
      value={{
        devices,
        authRequests,
        activeRequest,
        showAuthModal,
        isScanning,
        error,
        localIp,
        liveSyncActive,
        setShowAuthModal,
        setActiveRequest,
        toggleLiveSync,
        approveRequest,
        denyRequest,
        disconnectDevice,
        loadAuthRequests,
        loadConnectedDevices,
        loadDeviceInfo,
      }}
    >
      {children}

      {/* Global Connection Request Modal */}
      <Modal
        visible={showAuthModal && !!activeRequest}
        onClose={() => setShowAuthModal(false)}
        title="Incoming Connection Request"
        subtitle="A mobile device wants to link with this dashboard"
        primaryButtonDetails={{
          label: "Allow Device",
          onClick: () => activeRequest && approveRequest(activeRequest.id),
          color: "green",
        }}
        secondaryButtonDetails={{
          label: "Deny",
          onClick: () => activeRequest && denyRequest(activeRequest.id),
          color: "red",
        }}
      >
        {activeRequest ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Device <strong>{activeRequest.mobile?.name}</strong> is requesting access with email <strong>{activeRequest.email}</strong>.
            </p>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3 text-xs font-mono space-y-1 text-neutral-500">
              <p>IP Address: {activeRequest.mobile?.ip_address}</p>
              <p>Port: {activeRequest.mobile?.port}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </DevicesContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DevicesContext);
  if (!context) {
    throw new Error("useDevices must be used within a DevicesProvider");
  }
  return context;
}

// Alias for backwards compatibility
export const useNetwork = useDevices;
