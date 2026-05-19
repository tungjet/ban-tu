import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight, Lock, Eye, Database, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách Bảo mật | Tủ Nhựa Giá Rẻ",
  description: "Chính sách bảo mật thông tin khách hàng tại Tủ Nhựa Giá Rẻ.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" /> Trang chủ
            </Link>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-slate-900 font-medium">Bảo mật thông tin</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Chính sách Bảo mật thông tin</h1>
          <p className="text-slate-500 text-sm mt-2">Cập nhật lần cuối: tháng 1/2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thông tin chúng tôi thu thập</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Họ tên, số điện thoại, địa chỉ giao hàng khi đặt hàng.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Email (nếu khách hàng cung cấp).
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Nội dung câu hỏi, bình luận về sản phẩm.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Mục đích sử dụng</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Xử lý và giao hàng đơn đặt hàng của bạn.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Liên hệ xác nhận đơn hàng và hỗ trợ sau bán hàng.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Cải thiện chất lượng dịch vụ và sản phẩm.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Bảo mật dữ liệu</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Dữ liệu được lưu trữ an toàn trên hệ thống Supabase với mã hóa SSL.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Chúng tôi <strong>không bán hoặc chia sẻ</strong> thông tin cá nhân của bạn cho bên thứ ba.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Chỉ nhân viên được ủy quyền mới có quyền truy cập dữ liệu khách hàng.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Quyền của bạn</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold mt-0.5">•</span>
              Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold mt-0.5">•</span>
              Liên hệ với chúng tôi qua hotline để thực hiện các yêu cầu này.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
