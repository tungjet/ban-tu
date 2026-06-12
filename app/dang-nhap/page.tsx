"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { signIn, signOut } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        throw new Error("Email hoặc mật khẩu không đúng");
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (!session?.user) {
        await signOut();
        throw new Error("Đăng nhập thất bại");
      }

      if (session.user.status === "banned") {
        await signOut();
        throw new Error("Tài khoản đã bị khóa");
      }

      if (session.user.role === "admin") {
        toast.success("Đăng nhập thành công");
        router.push("/admin");
      } else if (session.user.role === "collaborator") {
        // CTV (pending or active) both go to dashboard
        toast.success("Đăng nhập thành công");
        router.push("/cong-tac-vien");
      } else {
        // customer
        toast.success("Đăng nhập thành công");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full space-y-4">
        <div className="text-center mb-6">
          <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
          <p className="text-slate-500 text-sm mt-1">Dành cho Admin, CTV và khách hàng</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Đăng nhập
        </button>

        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky-ctv" className="text-blue-600 hover:underline">
            Đăng ký CTV
          </Link>
        </p>
      </form>
    </main>
  );
}
