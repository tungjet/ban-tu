"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface ProductAdminEditButtonProps {
  productId: string | number;
}

export function ProductAdminEditButton({ productId }: ProductAdminEditButtonProps) {
  const { data, status } = useSession();
  const isLoggedIn = status === "authenticated" && Boolean(data?.user);
  const isReady = status !== "loading";

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
