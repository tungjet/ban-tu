"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2, Banknote, Handshake } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface CollabRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  referral_code: string | null;
  commission_balance: number;
  created_at: string;
}

interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  admin_note: string | null;
  created_at: string;
  collaborator_id: string;
  profiles?: { full_name: string | null; email?: string };
}

export default function CollaboratorsTab() {
  const [subTab, setSubTab] = useState<"list" | "withdrawals">("list");
  const [collabs, setCollabs] = useState<CollabRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const loadCollabs = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/collaborators", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const d = await res.json();
    setCollabs(d.collaborators || []);
  };

  const loadWithdrawals = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/withdrawals", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const d = await res.json();
    setWithdrawals(d.withdrawals || []);
  };

  useEffect(() => {
    Promise.all([loadCollabs(), loadWithdrawals()]).finally(() => setLoading(false));
  }, []);

  const updateColl = async (id: string, patch: Partial<CollabRow>) => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/admin/collaborators/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Lỗi");
      return;
    }
    toast.success("Đã cập nhật");
    loadCollabs();
  };

  const processWithdrawal = async (id: string, status: "approved" | "rejected" | "paid", note?: string) => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, admin_note: note }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Lỗi");
      return;
    }
    toast.success("Đã cập nhật");
    loadWithdrawals();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setSubTab("list")} className={`px-4 py-2 text-sm font-medium border-b-2 ${subTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"}`}>
          <Handshake className="w-4 h-4 inline mr-1" /> Danh sách CTV
        </button>
        <button onClick={() => setSubTab("withdrawals")} className={`px-4 py-2 text-sm font-medium border-b-2 ${subTab === "withdrawals" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"}`}>
          <Banknote className="w-4 h-4 inline mr-1" /> Yêu cầu rút tiền {withdrawals.filter((w) => w.status === "pending").length > 0 && <span className="ml-1 bg-rose-500 text-white text-xs rounded-full px-1.5">{withdrawals.filter((w) => w.status === "pending").length}</span>}
        </button>
      </div>

      {subTab === "list" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <h2 className="font-bold text-slate-900 mb-4">Danh sách cộng tác viên</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Họ tên</th>
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Số dư</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {collabs.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có CTV</td></tr>}
              {collabs.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.full_name || "—"}</div>
                    <div className="text-xs text-slate-500">{c.email || c.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-600">{c.referral_code || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      c.status === "active" ? "bg-green-100 text-green-700" :
                      c.status === "pending" ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {c.status === "active" ? "Hoạt động" : c.status === "pending" ? "Chờ duyệt" : "Bị khóa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(c.commission_balance).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {c.status === "pending" && <button onClick={() => updateColl(c.id, { status: "active" })} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Duyệt</button>}
                    {c.status === "active" && <button onClick={() => updateColl(c.id, { status: "banned" })} className="px-2 py-1 bg-rose-500 text-white text-xs rounded">Khóa</button>}
                    {c.status === "banned" && <button onClick={() => updateColl(c.id, { status: "active" })} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Mở khóa</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "withdrawals" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <h2 className="font-bold text-slate-900 mb-4">Yêu cầu rút tiền</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">CTV</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-left">Ngân hàng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có yêu cầu</td></tr>}
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{w.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-slate-500 font-mono">{w.profiles?.email || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{Number(w.amount).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3 text-xs">{w.bank_name}<br/>{w.bank_account} - {w.bank_holder}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      w.status === "pending" ? "bg-amber-100 text-amber-700" :
                      w.status === "approved" ? "bg-blue-100 text-blue-700" :
                      w.status === "paid" ? "bg-green-100 text-green-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {w.status === "pending" ? "Chờ duyệt" : w.status === "approved" ? "Đã duyệt" : w.status === "paid" ? "Đã trả" : "Từ chối"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(w.created_at).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {w.status === "pending" && (
                      <>
                        <button onClick={() => { const note = prompt("Ghi chú (tùy chọn)"); processWithdrawal(w.id, "approved", note || undefined); }} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Duyệt</button>
                        <button onClick={() => { const note = prompt("Lý do từ chối"); if (note) processWithdrawal(w.id, "rejected", note); }} className="px-2 py-1 bg-rose-500 text-white text-xs rounded">Từ chối</button>
                      </>
                    )}
                    {w.status === "approved" && <button onClick={() => processWithdrawal(w.id, "paid", "Đã chuyển khoản")} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Đánh dấu đã trả</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
