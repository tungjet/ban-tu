"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function LoginCTVPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Đăng nhập thất bại");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "collaborator") {
        await supabase.auth.signOut();
        throw new Error("Tài khoản không phải CTV");
      }
      if (profile.status !== "active") {
        await supabase.auth.signOut();
        throw new Error("Tài khoản chưa được duyệt hoặc đã bị khóa");
      }

      toast.success("Đăng nhập thành công");
      router.push("/cong-tac-vien");
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
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập CTV</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Đăng nhập
        </button>

        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản? <Link href="/dang-ky-ctv" className="text-blue-600 hover:underline">Đăng ký</Link>
        </p>
      </form>
    </main>
  );
}
