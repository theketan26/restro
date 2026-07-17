"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { showToast } from "@/components/Toast";
import { Input } from "@/components/Input";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1"}:${process.env.NEXT_PUBLIC_API_BASE_PORT || "2326"}/api`;

export default function SettingsPage() {
  const [masterName, setMasterName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings/master-name`);
        const payload = await res.json();
        if (payload?.success && payload?.data) {
          setMasterName(payload.data);
        }
      } catch {
        // ignore
      }
    };

    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/master-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ master_name: masterName }),
      });
      const payload = await res.json();
      if (res.ok && payload?.success) {
        setStatus("Master name saved");
        showToast("Master name updated successfully", { variant: "success" });
      } else {
        const errMsg = payload?.error || "Failed to save master name";
        setStatus(errMsg);
        showToast("Failed to update master name", { description: errMsg, variant: "error" });
      }
    } catch {
      setStatus("Unable to save master name right now");
      showToast("Failed to update master name", { description: "Unable to save master name right now", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <h1 className="text-2xl font-semibold dark:text-white">Settings</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Set a master name that will be shown to mobile devices instead of the device name.
      </p>

      <div className="mt-6 space-y-4">
        <Input
          label="Master name"
          value={masterName}
          onChange={(e) => setMasterName(e.target.value)}
          placeholder="Enter a master name"
          inputSize="lg"
          variant="outlined"
          colorScheme="blue"
        />

        <Button
          type="button"
          onClick={save}
          disabled={saving}
          variant="primary"
        >
          {saving ? "Saving..." : "Save"}
        </Button>

        {status ? (
          <p className={`text-sm ${status === "Master name saved" ? "text-green-600" : "text-red-600"}`}>{status}</p>
        ) : null}
      </div>
    </div>
  );
}
