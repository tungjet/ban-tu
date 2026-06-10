"use client";

import { useEffect, useState, useCallback } from "react";

export interface StoreSettings {
  phone: string;
  zalo: string;
  facebook: string;
  address: string;
  defaultCommissionPercent: number;
}

const DEFAULTS: StoreSettings = {
  phone: "",
  zalo: "",
  facebook: "",
  address: "",
  defaultCommissionPercent: 5,
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store-settings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULTS, ...data });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateSettings = useCallback(
    async (patch: Partial<StoreSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          // revert on error
          await load();
        }
      } catch {
        await load();
      }
    },
    [load]
  );

  return { settings, loading, updateSettings, refresh: load };
}
