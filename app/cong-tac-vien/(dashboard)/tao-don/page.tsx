"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { FormInput, FormTextarea, FormSelect } from "@/components/form";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface LineItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export default function CTVDashboardCreateOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("products").select("id, name, price, image_url").eq("is_published", true).order("name")
      .then(({ data }) => setProducts(data || []));
  }, []);

  const addItem = (p: Product) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.product_id === p.id);
      if (ex) return prev.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: p.id, name: p.name, price: Number(p.price) || 0, quantity: 1, image: p.image_url }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return setItems((p) => p.filter((i) => i.product_id !== id));
    setItems((p) => p.map((i) => i.product_id === id ? { ...i, quantity: qty } : i));
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
    if (!customerName.trim() || !phone || !address) return toast.error("Vui lòng điền tên, SĐT, địa chỉ khách");

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập hết hạn");

      const res = await fetch("/api/collaborator/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customer_name: customerName, phone, email, address, note,
          items: items.map((i) => ({ id: i.product_id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo đơn thất bại");
      toast.success(`Đã tạo đơn #${data.order_code}`);
      setItems([]);
      setCustomerName(""); setPhone(""); setEmail(""); setAddress(""); setNote("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Tạo đơn hàng thay khách</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <h2 className="font-bold text-slate-900">Thông tin khách</h2>
          <FormInput label="Họ tên" type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <FormInput label="Số điện thoại" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormTextarea label="Địa chỉ" required rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          <FormTextarea label="Ghi chú" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <h2 className="font-bold text-slate-900">Sản phẩm</h2>
          <FormSelect onChange={(e) => { const p = products.find((x) => x.id === e.target.value); if (p) addItem(p); e.currentTarget.value = ""; }} defaultValue="">
            <option value="" disabled>+ Thêm sản phẩm...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {Number(p.price).toLocaleString("vi-VN")}đ</option>)}
          </FormSelect>

          {items.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Chưa có sản phẩm</p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.product_id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className="flex-1 text-sm truncate">{i.name}</span>
                  <input type="number" min={1} value={i.quantity} onChange={(e) => updateQty(i.product_id, Number(e.target.value))} className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-center" />
                  <span className="text-sm font-semibold w-24 text-right">{(i.price * i.quantity).toLocaleString("vi-VN")}đ</span>
                  <button type="button" onClick={() => setItems((p) => p.filter((x) => x.product_id !== i.product_id))} className="text-rose-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                <span>Tổng</span>
                <span className="text-blue-600">{total.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Tạo đơn hàng
      </button>
    </form>
  );
}
