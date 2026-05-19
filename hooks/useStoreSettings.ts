"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface StoreSettings {
  phone: string;
  zalo: string;
  facebook: string;
  address: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  phone: "",
  zalo: "",
  facebook: "",
  address: "",
};

// Cache để tránh fetch nhiều lần
let cachedSettings: StoreSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(() => cachedSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(() => !cachedSettings);

  useEffect(() => {
    const now = Date.now();
    if (cachedSettings && now - cacheTime < CACHE_TTL) {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timer);
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .eq("id", "default")
          .single();

        if (!error && data) {
          const s: StoreSettings = {
            phone: data.phone || "",
            zalo: data.zalo || "",
            facebook: data.facebook || "",
            address: data.address || "",
          };
          cachedSettings = s;
          cacheTime = Date.now();
          setSettings(s);
        }
      } catch {
        // Fallback silently if table doesn't exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: StoreSettings): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      cachedSettings = newSettings;
      cacheTime = Date.now();
      setSettings(newSettings);
      return true;
    } catch {
      return false;
    }
  };

  return { settings, loading, updateSettings };
}
