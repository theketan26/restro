"use client";

import { useDevices } from "@/hooks/useDevices";
import { Button } from "@/components/Button";
import { 
  BiDevices, 
  BiRefresh, 
  BiWifi, 
  BiLaptop, 
  BiMobileAlt, 
  BiNetworkChart, 
  BiInfoCircle, 
  BiCheckCircle,
  BiSync
} from "react-icons/bi";

export default function DevicesPage() {
  const {
    authRequests,
    devices,
    isScanning,
    error,
    localIp,
    liveSyncActive,
    toggleLiveSync,
    approveRequest,
    denyRequest,
    disconnectDevice,
    loadConnectedDevices,
  } = useDevices();

  // Helper to determine device icon based on device type
  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType?.toLowerCase() || "";
    if (type.includes("mobile") || type.includes("phone")) {
      return <BiMobileAlt className="w-8 h-8 text-indigo-505" />;
    }
    return <BiLaptop className="w-8 h-8 text-indigo-505" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header card */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 transition-all duration-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-650 dark:text-indigo-400">
                <BiDevices className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-semibold dark:text-white">Devices</h1>
            </div>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Manage and discover local LAN devices running the Resto service.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Live Sync Toggle */}
            <Button
              onClick={toggleLiveSync}
              variant="secondary"
              className="flex items-center gap-2 font-medium"
            >
              <BiSync className={`w-4 h-4 ${liveSyncActive ? "animate-spin text-green-500" : "text-neutral-400"}`} />
              {liveSyncActive ? "Live Sync: Active" : "Live Sync: Off"}
            </Button>

            {/* Scan Status / Refresh button */}
            <Button
              onClick={loadConnectedDevices}
              variant="primary"
              disabled={isScanning}
              className="flex items-center gap-2 bg-indigo-605 hover:bg-indigo-700 font-semibold"
            >
              <BiRefresh className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning..." : "Scan Network"}
            </Button>
          </div>
        </div>

        {/* Info widgets */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-850 dark:bg-neutral-900/40 dark:text-neutral-300 flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <BiWifi className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-905 dark:text-white text-xs uppercase tracking-wide">Local IP Address</p>
              <p className="mt-1 font-mono text-sm">{localIp ?? "Not available"}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-850 dark:bg-neutral-900/40 dark:text-neutral-300 flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-950/40 rounded-xl text-green-600 dark:text-green-400">
              <BiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-905 dark:text-white text-xs uppercase tracking-wide">Connected Devices</p>
              <p className="mt-1 text-sm font-semibold">{devices.length} {devices.length === 1 ? 'device' : 'devices'} active</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-neutral-55/40 p-4 text-sm text-neutral-600 dark:border-neutral-850 dark:bg-neutral-900/40 dark:text-neutral-300 flex items-center gap-3 sm:col-span-2 lg:col-span-1">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <BiSync className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-905 dark:text-white text-xs uppercase tracking-wide">Live Discovery</p>
              <p className="mt-1 text-sm">{liveSyncActive ? "Auto-refreshing every 5s" : "Manual discovery"}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 flex items-center gap-2">
          <BiInfoCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Connection Requests Section */}
      {authRequests.length > 0 && (
        <div className="rounded-3xl border border-amber-250 bg-amber-50/50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h3 className="font-semibold text-amber-900 dark:text-amber-400 text-lg">
              Pending Connection Requests ({authRequests.length})
            </h3>
          </div>
          <div className="grid gap-4">
            {authRequests.map((r: any) => (
              <div 
                key={r.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/30 shadow-sm"
              >
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {r.mobile.name} — <span className="text-sm font-normal text-neutral-500">{r.email}</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 font-mono">
                    IP: {r.mobile.ip_address}:{r.mobile.port}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => approveRequest(r.id)} 
                    variant="success" 
                    className="px-4 py-2 text-xs font-semibold"
                  >
                    Allow Device
                  </Button>
                  <Button 
                    onClick={() => denyRequest(r.id)} 
                    variant="danger" 
                    className="px-4 py-2 text-xs font-semibold"
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Devices List */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Connected Devices</h2>
        
        {devices.length === 0 ? (
          <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center bg-white dark:bg-neutral-950/20">
            <BiNetworkChart className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" />
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No devices connected</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
              Devices running the Resto companion app on your Wi-Fi network will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-55/10 dark:bg-indigo-950/40 rounded-2xl shrink-0">
                        {getDeviceIcon(device.device_type)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-neutral-905 dark:text-white truncate">
                          {device.user_name || device.master_name || device.name}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {device.user_email ? `${device.user_email} · ` : ""}{device.device_type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Connected
                  </span>

                  <Button
                    onClick={() => disconnectDevice(device.id)}
                    variant="danger"
                    className="px-3 py-1 text-xs font-semibold"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
