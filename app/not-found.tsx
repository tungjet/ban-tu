import Link from "next/link";
import { Home, Search } from "lucide-react";
import type { Metadata } from "next";
import BackButton from "./not-found/BackButton";

export const metadata: Metadata = {
  title: "Không tìm thấy trang | Tủ Nhựa Giá Rẻ",
  description: "Trang bạn tìm kiếm không tồn tại.",
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-black text-slate-200 leading-none select-none">
          404
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3 -mt-4">
          Không tìm thấy trang
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          Hãy thử tìm kiếm sản phẩm hoặc quay về trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
          <Link
            href="/san-pham"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <Search className="w-4 h-4" />
            Xem sản phẩm
          </Link>
        </div>

        <BackButton />
      </div>
    </main>
  );
}
