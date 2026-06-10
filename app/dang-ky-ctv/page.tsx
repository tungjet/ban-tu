"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function RegisterCTVPage() {
  const router = useRouter();
  const { role, isLoading } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (role === "collaborator") router.replace("/cong-tac-vien");
    else if (role === "admin") router.replace("/admin");
  }, [role, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự");
    if (password !== confirm) return toast.error("Mật khẩu xác nhận không khớp");
    if (!fullName.trim()) return toast.error("Vui lòng nhập họ tên");
    if (!/^0\d{9,10}$/.test(phone)) return toast.error("Số điện thoại không hợp lệ");

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/ctv-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");
      setSuccess(true);
      toast.success("Đăng ký thành công! Vui lòng chờ admin duyệt.");
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h1>
          <p className="text-slate-500 mb-6">
            Tài khoản của bạn đang chờ admin duyệt. Chúng tôi sẽ thông báo qua email khi được kích hoạt.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">Về trang chủ</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full space-y-4">
        <div className="text-center mb-6">
          <UserPlus className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký CTV</h1>
          <p className="text-slate-500 text-sm mt-1">Trở thành cộng tác viên bán hàng, nhận hoa hồng hấp dẫn</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên *</label>
          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu *</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu *</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Đăng ký
        </button>

        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản? <Link href="/dang-nhap-ctv" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </form>
    </main>
  );
}
