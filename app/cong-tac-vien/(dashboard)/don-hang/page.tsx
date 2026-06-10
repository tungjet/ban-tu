"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface OrderRow {
  id: string;
  order_code: string;
  customer_name: string;
  total_amount: number;
  status: string;
  commission_status: string;
  commission_amount: number | null;
  created_at: string;
}

const statusColor: Record<string, string> = {
  "Chờ xử lý": "bg-amber-100 text-amber-700",
  "Chờ thanh toán": "bg-yellow-100 text-yellow-700",
  "Đã xác nhận": "bg-indigo-100 text-indigo-700",
  "Đang giao": "bg-blue-100 text-blue-700",
  "Đã hoàn thành": "bg-green-100 text-green-700",
  "Đã huỷ": "bg-rose-100 text-rose-700",
};

export default function CTVDashboardOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collaborator/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <p className="text-slate-500 text-center py-12">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-left">Khách</th>
                <th className="px-4 py-3 text-right">Tổng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hoa hồng</th>
                <th className="px-4 py-3 text-left">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">#{o.order_code || o.id.slice(-5)}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(o.total_amount).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[o.status] || "bg-slate-100 text-slate-700"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.commission_status === "earned" ? (
                      <span className="text-green-600 font-semibold">+{Number(o.commission_amount).toLocaleString("vi-VN")}đ</span>
                    ) : o.commission_status === "cancelled" ? (
                      <span className="text-rose-500 line-through">{Number(o.commission_amount).toLocaleString("vi-VN")}đ</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
