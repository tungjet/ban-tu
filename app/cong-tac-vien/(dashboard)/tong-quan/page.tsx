"use client";

import { useEffect, useState } from "react";
import { Copy, Check, TrendingUp, ShoppingBag, Coins } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CTVDashboardPage() {
  const { user } = useCurrentUser();
  const profile = user as any;
  const [stats, setStats] = useState({ thisMonth: 0, totalEarned: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    fetch("/api/collaborator/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [profile?.id]);

  const refLink = profile?.referral_code && typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${profile.referral_code}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Đã sao chép");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Coins className="w-4 h-4" /> Số dư
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {Number(profile?.commission_balance ?? 0).toLocaleString("vi-VN")}đ
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <ShoppingBag className="w-4 h-4" /> Đơn tháng này
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.thisMonth}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <TrendingUp className="w-4 h-4" /> Tổng đã earned
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {Number(stats.totalEarned).toLocaleString("vi-VN")}đ
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-900 mb-2">Link giới thiệu của bạn</h2>
        {profile?.referral_code ? (
          <>
            <p className="text-sm text-slate-500 mb-3">Chia sẻ link này cho khách hàng. Khi họ đặt hàng, hoa hồng sẽ được ghi nhận cho bạn.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono truncate">
                {refLink}
              </code>
              <button onClick={copyLink} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Đã chép" : "Sao chép"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Mã CTV: <span className="font-mono font-bold text-blue-600">{profile.referral_code}</span></p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Mã giới thiệu chưa được tạo. Vui lòng liên hệ admin.</p>
        )}
      </div>
    </div>
  );
}
