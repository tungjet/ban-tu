"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Coins, Banknote, Plus, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";

const tabs = [
  { id: "tong-quan", label: "Tổng quan", icon: LayoutDashboard, href: "/cong-tac-vien/tong-quan" },
  { id: "don-hang", label: "Đơn hàng", icon: ShoppingBag, href: "/cong-tac-vien/don-hang" },
  { id: "hoa-hong", label: "Hoa hồng", icon: Coins, href: "/cong-tac-vien/hoa-hong" },
  { id: "rut-tien", label: "Rút tiền", icon: Banknote, href: "/cong-tac-vien/rut-tien" },
  { id: "tao-don", label: "Tạo đơn", icon: Plus, href: "/cong-tac-vien/tao-don" },
];

export default function CTVDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading, isCollaborator } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/dang-nhap-ctv");
      return;
    }
    if (profile && !isCollaborator) {
      toast.error("Tài khoản chưa được duyệt");
      router.replace("/dang-nhap-ctv");
    }
  }, [isLoading, user, profile, isCollaborator, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading || !isCollaborator) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-500">
        Đang tải...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col p-4 sticky top-0 h-screen">
        <div className="mb-6">
          <h2 className="font-bold text-slate-900">Khu vực CTV</h2>
          <p className="text-sm text-slate-500 mt-1 truncate">{profile?.full_name || user?.email}</p>
          {profile?.referral_code && (
            <p className="text-xs text-blue-600 font-mono mt-1">Mã: {profile.referral_code}</p>
          )}
        </div>
        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-xl">
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Khu vực CTV</h2>
          <button onClick={handleLogout} className="text-sm text-slate-500">
            <LogOut className="w-4 h-4" />
          </button>
        </header>
        <nav className="md:hidden bg-white border-b border-slate-200 flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                  active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
