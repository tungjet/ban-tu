"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CommentForm({ productId }: { productId: string }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Chỉ chạy ở client side
    const savedName = localStorage.getItem("commenterName");
    if (savedName) {
      const timer = window.setTimeout(() => setName(savedName), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    localStorage.setItem("commenterName", value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('comments')
      .insert([{ 
        product_id: productId, 
        user_name: name.trim() || null, 
        content: content.trim() 
      }]);

    setIsSubmitting(false);

    if (error) {
      toast.error("Gửi câu hỏi thất bại. Vui lòng thử lại!");
      console.error(error);
    } else {
      toast.success("Gửi câu hỏi thành công!");
      setContent("");
      router.refresh(); // Tải lại dữ liệu ở Server Component để hiển thị comment mới
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-6 mb-8">
      <h3 className="font-bold text-slate-900 mb-4">Bạn có câu hỏi về sản phẩm?</h3>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3 text-slate-900 placeholder-slate-400"
          placeholder="Họ và tên (không bắt buộc)"
          value={name}
          onChange={handleNameChange}
        />
        <textarea 
          className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm mb-3 text-slate-900 placeholder-slate-500"
          rows={3}
          placeholder="Nhập câu hỏi của bạn tại đây..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
        <button 
          type="submit"
          className="bg-slate-900 text-white font-medium py-2.5 px-6 rounded-xl hover:bg-slate-800 transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang gửi..." : "Gửi câu hỏi"}
        </button>
      </form>
    </div>
  );
}
