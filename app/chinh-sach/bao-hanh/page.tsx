import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight, ShieldCheck, RefreshCw, Clock, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách Bảo hành & Đổi trả | Tủ Nhựa Giá Rẻ",
  description: "Chính sách bảo hành và đổi trả sản phẩm nội thất tại Tủ Nhựa Giá Rẻ.",
};

export default function WarrantyPage() {
  return (
    <main className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" /> Trang chủ
            </Link>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-slate-900 font-medium">Bảo hành & Đổi trả</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Chính sách Bảo hành & Đổi trả</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Bảo hành */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Chính sách Bảo hành</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Tất cả sản phẩm nội thất nhựa Ecoplast và nhôm kính được bảo hành <strong>10 năm</strong> về vật liệu.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Bảo hành <strong>2 năm</strong> về phụ kiện (bản lề, tay nắm, ray trượt).
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Bảo hành bao gồm: lỗi sản xuất, cong vênh do vật liệu, bong tróc bề mặt.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Không bảo hành các hư hỏng do tác động ngoại lực, sử dụng sai mục đích.
            </li>
          </ul>
        </section>

        {/* Đổi trả */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Chính sách Đổi trả</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Đổi trả miễn phí trong <strong>7 ngày</strong> nếu sản phẩm có lỗi từ nhà sản xuất.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Sản phẩm đổi trả phải còn nguyên vẹn, chưa qua lắp đặt hoặc sử dụng.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Vui lòng chụp ảnh lỗi và liên hệ hotline trước khi gửi hàng về.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Chi phí vận chuyển đổi trả do lỗi sản xuất: <strong>Tủ Nhựa Giá Rẻ chịu</strong>.
            </li>
          </ul>
        </section>

        {/* Thời gian xử lý */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thời gian xử lý</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              Yêu cầu bảo hành/đổi trả được xử lý trong <strong>3–5 ngày làm việc</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              Hoàn tiền (nếu có) trong vòng <strong>7–10 ngày làm việc</strong>.
            </li>
          </ul>
        </section>

        {/* Liên hệ */}
        <section className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Cần hỗ trợ?</h2>
          </div>
          <p className="text-slate-600 text-sm">
            Liên hệ với chúng tôi qua hotline hoặc Zalo để được hỗ trợ nhanh nhất.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors"
          >
            Về trang chủ để liên hệ
          </Link>
        </section>
      </div>
    </main>
  );
}
