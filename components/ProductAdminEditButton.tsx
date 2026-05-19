"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProductAdminEditButtonProps {
  productId: string | number;
}

export function ProductAdminEditButton({ productId }: ProductAdminEditButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const applySession = (hasSession: boolean) => {
      if (!active) return;
      setIsLoggedIn(hasSession);
      setIsReady(true);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(Boolean(session));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(Boolean(session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isReady || !isLoggedIn) return null;

  return (
    <Link
      href={`/admin?tab=products&editProduct=${encodeURIComponent(String(productId))}`}
      className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 flex items-center justify-center transition-colors shadow-sm"
      aria-label="Sửa sản phẩm trong admin"
      title="Sửa sản phẩm"
    >
      <Pencil className="w-4 h-4" />
    </Link>
  );
}
