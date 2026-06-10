"use client";

import { useEffect, useState } from "react";
import { Loader2, Banknote } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  created_at: string;
  processed_at: string | null;
  admin_note: string | null;
}

export default function CTVDashboardWithdrawPage() {
  const { profile, refresh } = useCurrentUser();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch("/api/collaborator/withdrawals", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.withdrawals || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (profile) {
      setBankName(profile.bank_name || "");
      setBankAccount(profile.bank_account || "");
      setBankHolder(profile.bank_holder || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Số tiền không hợp lệ");
    if (!bankName || !bankAccount || !bankHolder) return toast.error("Vui lòng điền đầy đủ thông tin ngân hàng");

    setSubmitting(true);
    try {
      const res = await fetch("/api/collaborator/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amt, bank_name: bankName, bank_account: bankAccount, bank_holder: bankHolder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yêu cầu thất bại");
      toast.success("Yêu cầu đã gửi, vui lòng chờ admin duyệt");
      setAmount("");
      load();
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Rút tiền</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Tạo yêu cầu rút</h2>
          <div className="text-sm text-slate-500">Số dư: <span className="font-bold text-blue-600">{Number(profile?.commission_balance ?? 0).toLocaleString("vi-VN")}đ</span></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VNĐ) *</label>
            <input type="number" required min={1000} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên ngân hàng *</label>
            <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="VD: Vietcombank" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số tài khoản *</label>
            <input type="text" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chủ tài khoản *</label>
            <input type="text" required value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
            Gửi yêu cầu
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-bold text-slate-900 mb-3">Lịch sử yêu cầu</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 text-center py-12 bg-white rounded-2xl">Chưa có yêu cầu nào.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Ngân hàng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                    <td className="px-4 py-3 text-right font-semibold">{Number(r.amount).toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3 text-xs">{r.bank_name} - {r.bank_account} - {r.bank_holder}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.status === "pending" ? "bg-amber-100 text-amber-700" :
                        r.status === "approved" ? "bg-blue-100 text-blue-700" :
                        r.status === "paid" ? "bg-green-100 text-green-700" :
                        "bg-rose-100 text-rose-700"
                      }`}>
                        {r.status === "pending" ? "Chờ duyệt" : r.status === "approved" ? "Đã duyệt" : r.status === "paid" ? "Đã trả" : "Từ chối"}
                      </span>
                      {r.admin_note && <p className="text-xs text-slate-400 mt-1">{r.admin_note}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
