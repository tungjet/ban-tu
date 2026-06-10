"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { supabase } from "@/lib/supabase";
import {
  CreditCard,
  Truck,
  ClipboardList,
  CheckCircle2,
  Home,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export default function CheckoutPage() {
  const { items, clearCart, updateQuantity, removeItem } = useCartStore();
  const [isOrdered, setIsOrdered] = useState(false);
  const [isAwaitingBankTransfer, setIsAwaitingBankTransfer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [orderedTotal, setOrderedTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank">("cod");

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;
  const paymentTotal = orderedTotal || total;
  const bankCode = "VCB";
  const bankAccountNumber = "1234567890";
  const bankAccountName = "BANTU STORE";
  const qrPaymentUrl = orderCode
    ? `https://img.vietqr.io/image/${bankCode}-${bankAccountNumber}-compact2.png?${new URLSearchParams({
        amount: String(paymentTotal),
        addInfo: `Thanh toan ${orderCode}`,
        accountName: bankAccountName,
      }).toString()}`
    : "";

  const createOrder = async (code: string, showSuccess = true) => {
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    const orderItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));

    const res = await fetch("/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        payment_method: paymentMethod,
        total_amount: total,
        status: paymentMethod === "bank" ? "Chờ thanh toán" : "Chờ xử lý",
        items: orderItems,
        order_code: code,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      setIsSubmitting(false);
      toast.error("Đặt hàng thất bại: " + (result.error || "Unknown"));
      return;
    }
    const data = { order_code: result.order_code, id: result.id };

    setIsSubmitting(false);

    setOrderCode(data?.order_code || code);
    setOrderedTotal(total);
    setIsOrdered(showSuccess);
    setIsAwaitingBankTransfer(!showSuccess && paymentMethod === "bank");
    if (!showSuccess) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    clearCart();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    const code = orderCode || `BT-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderCode(code);

    if (paymentMethod === "bank") {
      await createOrder(code, false);
      return;
    }

    await createOrder(code);
    return;

    /*
    setIsSubmitting(true);

    // Sinh order_code dạng BT-<6 số>
    const code = `BT-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
          payment_method: paymentMethod === "cod" ? "COD" : "Chuyển khoản",
          total_amount: total,
          status: "Chờ xử lý",
          items: orderItems,
          order_code: code,
        },
      ])
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      toast.error("Đặt hàng thất bại: " + error.message);
      return;
    }

    setOrderCode(data?.order_code || code);
    setIsOrdered(true);
    clearCart();
    */
  };

  // Trạng thái đơn hàng rỗng
  const handleConfirmBankTransfer = async () => {
    if (!orderCode || isSubmitting) return;

    setIsSubmitting(true);
    const res = await fetch(`/api/public/orders/${orderCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "Chờ xử lý" }),
    });
    const result = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      console.error(result);
      toast.error("Xác nhận chuyển khoản thất bại: " + (result.error || "Unknown"));
      return;
    }

    setIsAwaitingBankTransfer(false);
    setIsOrdered(true);
  };

  if (items.length === 0 && !isOrdered && !isAwaitingBankTransfer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Giỏ hàng đang trống</h1>
          <p className="text-slate-500 mb-6">Bạn chưa có sản phẩm nào để tiến hành thanh toán.</p>
          <Link href="/san-pham" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors w-full gap-2">
            <ArrowLeft className="w-5 h-5" /> Quay lại mua sắm
          </Link>
        </div>
      </div>
    );
  }

  // Trạng thái đặt hàng thành công
  if (isAwaitingBankTransfer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Toaster />
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
            <CreditCard className="w-10 h-10" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Chuyển khoản để hoàn tất đơn hàng</h1>
          <p className="text-slate-500 mb-6">
            Đơn hàng đã được ghi nhận. Vui lòng chuyển khoản đúng số tiền và ghi nội dung là mã đơn bên dưới, sau đó bấm &quot;Đã chuyển khoản&quot;.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl text-left mb-6">
            <p className="text-sm text-slate-600 mb-1">
              Mã đơn hàng: <span className="font-bold text-slate-900">#{orderCode}</span>
            </p>
            <p className="text-sm text-slate-600 mb-1">
              Số tiền: <span className="font-bold text-red-600">{paymentTotal.toLocaleString("vi-VN")}đ</span>
            </p>
            <p className="text-sm text-slate-600 mb-3">
              Nội dung chuyển khoản: <span className="font-bold text-slate-900">Thanh toan {orderCode}</span>
            </p>

            <div className="border-t border-slate-200 pt-3 mt-1 text-center">
              <p className="text-xs text-slate-500 mb-2">Quét mã QR để chuyển khoản:</p>
              <div className="w-full max-w-56 aspect-square mx-auto bg-white p-2 rounded-xl border border-slate-100">
                <Image
                  src={qrPaymentUrl}
                  alt="Mã QR thanh toán"
                  width={224}
                  height={224}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmBankTransfer}
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xác nhận...
              </>
            ) : (
              <>
                Đã chuyển khoản
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          <Link href="/" className="w-full mt-3 inline-flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-colors">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (isOrdered) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Toaster />
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-slate-500 mb-6">Cảm ơn bạn đã tin tưởng Tủ Nhựa Giá Rẻ. Nhân viên sẽ liên hệ với bạn để xác nhận đơn hàng trong thời gian sớm nhất.</p>
          <div className="bg-slate-50 p-4 rounded-xl text-left mb-6">
            <p className="text-sm text-slate-600 mb-1">Mã đơn hàng: <span className="font-bold text-slate-900">#{orderCode}</span></p>
            <p className="text-sm text-slate-600 mb-3">Hình thức: <span className="font-bold text-slate-900">{paymentMethod === "cod" ? "Thu tiền khi nhận hàng (COD)" : "Chuyển khoản ngân hàng"}</span></p>

            {paymentMethod === "bank" && (
              <p className="text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm font-medium mb-3">
                Bạn đã đặt hàng thành công. Chúng tôi đang xác minh khoản chuyển khoản của bạn.
              </p>
            )}

            {paymentMethod === "bank" && isAwaitingBankTransfer && (
              <div className="border-t border-slate-200 pt-3 mt-1 text-center">
                <p className="text-xs text-slate-500 mb-2">Quét mã QR dưới đây để thanh toán:</p>
                <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl border border-slate-100">
                  <Image
                    src={qrPaymentUrl}
                    alt="Mã QR thanh toán"
                    width={192}
                    height={192}
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Số tiền: <span className="font-bold text-red-600">{paymentTotal.toLocaleString('vi-VN')}đ</span></p>
              </div>
            )}
          </div>
          <Link href="/" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors w-full gap-2">
            Về trang chủ <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <Toaster />
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-xs sm:text-sm text-slate-500 overflow-x-auto hide-scrollbar whitespace-nowrap">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" /> Trang chủ
            </Link>
            <span className="mx-2"><ChevronRight className="w-3 h-3" /></span>
            <Link href="/san-pham" className="hover:text-blue-600">Sản phẩm</Link>
            <span className="mx-2"><ChevronRight className="w-3 h-3" /></span>
            <span className="text-slate-900 font-medium">Thanh toán</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5 sm:mb-8">Thanh toán đơn hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* CỘT TRÁI: FORM THÔNG TIN */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 sm:space-y-6">
              {/* Thông tin giao hàng */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Thông tin giao hàng</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <RequiredMark /></label>
                    <input
                      type="text"
                      required
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-500 text-slate-900"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <RequiredMark /></label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-500 text-slate-900"
                        placeholder="0912345678"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email (không bắt buộc)</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-500 text-slate-900"
                        placeholder="a@gmail.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ nhận hàng <RequiredMark /></label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-500 text-slate-900"
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (tuỳ chọn)</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none placeholder-slate-500 text-slate-900"
                      rows={3}
                      placeholder="Thời gian giao hàng thuận tiện, yêu cầu đặc biệt..."
                    />
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Phương thức thanh toán</h2>
                </div>

                <div className="space-y-3">
                  <label className={`flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-slate-900">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-slate-500">Nhận hàng rồi mới thanh toán bằng tiền mặt.</p>
                    </div>
                  </label>

                  <label className={`flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod("bank")}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-slate-900">Chuyển khoản ngân hàng</p>
                      <p className="text-sm text-slate-500">Chuyển khoản qua app ngân hàng bằng quét mã QR.</p>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-6">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Đơn hàng của bạn</h2>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="divide-y divide-slate-100 max-h-64 sm:max-h-80 overflow-y-auto hide-scrollbar mb-4 sm:mb-6">
                {items.map((item) => (
                  <div key={item.id} className="py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2">{item.name}</h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              removeItem(item.id);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-xs sm:text-sm font-bold text-slate-900 shrink-0">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>

              {/* Chi tiết tính tiền */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tạm tính:</span>
                  <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600 font-medium">Miễn phí</span>
                </div>
                <div className="flex justify-between gap-3 text-base sm:text-lg font-bold text-slate-900 pt-3 border-t border-slate-100">
                  <span>Tổng tiền:</span>
                  <span className="text-blue-600">{total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Button Action */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 mt-6 shadow-lg shadow-blue-200/50 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {paymentMethod === "bank" ? "Tiếp tục chuyển khoản" : "Đặt hàng ngay"}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                Bằng cách bấm đặt hàng, bạn đồng ý với chính sách của Tủ Nhựa Giá Rẻ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
