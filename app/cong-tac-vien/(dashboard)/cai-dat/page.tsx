"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, User, Banknote } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CTVDashboardSettingsPage() {
  const { profile, refresh } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setBankName(profile.bankName || "");
      setBankAccount(profile.bankAccount || "");
      setBankHolder(profile.bankHolder || "");
    }
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && !/^0\d{9,10}$/.test(phone)) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/collaborator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu thất bại");
      toast.success("Đã lưu thông tin cá nhân");
      await refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !bankAccount || !bankHolder) {
      toast.error("Vui lòng điền đầy đủ thông tin ngân hàng");
      return;
    }
    setSavingBank(true);
    try {
      const res = await fetch("/api/collaborator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bankName, bankAccount, bankHolder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu thất bại");
      toast.success("Đã lưu thông tin ngân hàng");
      await refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Cài đặt tài khoản</h1>

      {/* Personal info */}
      <form onSubmit={saveProfile} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900">Thông tin cá nhân</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="VD: 0912345678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Email không thể thay đổi</p>
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu thông tin
        </button>
      </form>

      {/* Bank info */}
      <form onSubmit={saveBank} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Banknote className="w-5 h-5 text-green-600" />
          <h2 className="font-bold text-slate-900">Thông tin ngân hàng (nhận hoa hồng)</h2>
        </div>
        <p className="text-sm text-slate-500">Dùng để admin chuyển khoản hoa hồng khi bạn yêu cầu rút tiền.</p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên ngân hàng *</label>
          <input
            type="text"
            required
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="VD: Vietcombank"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số tài khoản *</label>
          <input
            type="text"
            required
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="VD: 1234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Chủ tài khoản *</label>
          <input
            type="text"
            required
            value={bankHolder}
            onChange={(e) => setBankHolder(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="VD: NGUYEN VAN A"
          />
        </div>
        <button
          type="submit"
          disabled={savingBank}
          className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu ngân hàng
        </button>
      </form>
    </div>
  );
}
