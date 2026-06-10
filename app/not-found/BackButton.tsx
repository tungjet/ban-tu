"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-blue-600 mt-6 transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Quay lại trang trước
    </button>
  );
}
