"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface CommissionRow {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  order_id: string | null;
  created_at: string;
}

const typeLabel: Record<string, { label: string; color: string }> = {
  order_earned: { label: "Hoa hồng đơn hàng", color: "text-green-600" },
  refund: { label: "Hoàn tác", color: "text-rose-500" },
  withdrawal: { label: "Rút tiền", color: "text-blue-600" },
  adjustment: { label: "Điều chỉnh", color: "text-slate-600" },
};

export default function CTVDashboardCommissionsPage() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collaborator/commissions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.commissions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Lịch sử hoa hồng</h1>
      {rows.length === 0 ? (
        <p className="text-slate-500 text-center py-12">Chưa có giao dịch nào.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-left">Ghi chú</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = typeLabel[r.type] || { label: r.type, color: "text-slate-600" };
                const isPositive = r.amount > 0;
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 font-medium ${meta.color}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {meta.label}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${isPositive ? "text-green-600" : "text-rose-500"}`}>
                      {isPositive ? "+" : ""}{Number(r.amount).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.note || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
