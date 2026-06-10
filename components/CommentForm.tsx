"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FormInput, FormTextarea } from "@/components/form";

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
        <FormInput
          containerClassName="mb-3"
          className="p-3 text-sm"
          placeholder="Họ và tên (không bắt buộc)"
          value={name}
          onChange={handleNameChange}
        />
        <FormTextarea
          containerClassName="mb-3"
          className="p-4 text-sm"
          rows={3}
          placeholder="Nhập câu hỏi của bạn tại đây..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
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
