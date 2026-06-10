"use client";

import { useEffect, useRef } from "react";

export default function ReferralCapture() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("ref");
    if (!code) return;

    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (normalized.length < 4) return;

    fetch(`/api/public/referral/${encodeURIComponent(normalized)}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          document.cookie = `bantu_ref=${normalized}; path=/; max-age=2592000; samesite=lax`;
          url.searchParams.delete("ref");
          window.history.replaceState({}, "", url.toString());
        }
      })
      .catch(() => {
        // silent
      });
  }, []);

  return null;
}
