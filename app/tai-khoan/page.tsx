"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=account");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
      Đang chuyển hướng đến trang tài khoản admin...
    </div>
  );
}
