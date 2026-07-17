"use client";

import Modal from "../components/Modal";
import { useNetwork } from "@/hooks/useDevices";
import { Button } from "@/components/Button";

export default function HomePage() {
  const {
    authRequests,
    activeRequest,
    showAuthModal,
    devices,
    error,
    localIp,
    approveRequest,
    denyRequest,
  } = useNetwork();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6 py-8">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold dark:text-white">Available Devices</h1>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Discover devices on your local LAN that are running the Stackrise service.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <p className="font-semibold text-neutral-900 dark:text-white">Local IP</p>
              <p className="mt-2">{localIp ?? "Not available"}</p>
            </div>
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <p className="font-semibold text-neutral-900 dark:text-white">Device Count</p>
              <p className="mt-2">{devices.length}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {authRequests.length > 0 && (
            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
              <h3 className="font-semibold">Pending Connection Requests</h3>
              <div className="mt-3 grid gap-3">
                {authRequests.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{r.mobile.name} — {r.email}</div>
                      <div className="text-sm text-neutral-500">{r.mobile.ip_address}:{r.mobile.port}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => approveRequest(r.id)} variant="success" className="px-4 py-2">Allow</Button>
                      <Button onClick={() => denyRequest(r.id)} variant="danger" className="px-4 py-2">Deny</Button>
                    </div>
                  </div>
                ))}

                <Modal visible={showAuthModal}>
                  {activeRequest ? (
                    <div>
                      <h3 className="text-lg font-semibold">Incoming Connection Request</h3>
                      <p className="mt-2">Device <strong>{activeRequest.mobile.name}</strong> is requesting access with email <strong>{activeRequest.email}</strong>.</p>
                      <p className="mt-2 text-sm text-neutral-500">IP: {activeRequest.mobile.ip_address}:{activeRequest.mobile.port}</p>
                      <div className="mt-4 flex gap-3 justify-end">
                        <Button onClick={() => denyRequest(activeRequest.id)} variant="danger" className="px-4 py-2">Deny</Button>
                        <Button onClick={() => approveRequest(activeRequest.id)} variant="success" className="px-4 py-2">Allow</Button>
                      </div>
                    </div>
                  ) : null}
                </Modal>
              </div>
            </div>
          )}
          {devices.map((device) => (
            <div
              key={device.id}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold dark:text-white">{device.master_name || device.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{device.device_type}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  {device.version}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">IP Address</p>
                  <p className="mt-2 font-medium text-neutral-900 dark:text-white">{device.ip_address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
