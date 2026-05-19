import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight, Truck, MapPin, Clock, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách Vận chuyển & Lắp đặt | Tủ Nhựa Giá Rẻ",
  description: "Thông tin về vận chuyển và lắp đặt sản phẩm nội thất tại Tủ Nhựa Giá Rẻ.",
};

export default function ShippingPage() {
  return (
    <main className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" /> Trang chủ
            </Link>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-slate-900 font-medium">Vận chuyển & Lắp đặt</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Chính sách Vận chuyển & Lắp đặt</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Vận chuyển</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <strong>Miễn phí vận chuyển</strong> trong bán kính 30km từ cửa hàng.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Ngoài bán kính 30km: phí vận chuyển tính theo khoảng cách, thỏa thuận trực tiếp.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              Giao hàng toàn quốc qua đơn vị vận chuyển đối tác (khách hàng chịu phí ship).
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Lắp đặt</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              <strong>Miễn phí lắp đặt</strong> tại nhà cho tất cả đơn hàng trong khu vực giao hàng.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Đội ngũ kỹ thuật viên chuyên nghiệp, lắp đặt đúng kỹ thuật, đảm bảo an toàn.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">•</span>
              Hướng dẫn sử dụng và bảo quản sản phẩm sau lắp đặt.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thời gian giao hàng</h2>
          </div>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              Nội thành: <strong>1–3 ngày</strong> sau khi xác nhận đơn hàng.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              Ngoại thành / tỉnh khác: <strong>3–7 ngày</strong> làm việc.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              Đơn hàng đặt theo yêu cầu (kích thước đặc biệt): <strong>7–14 ngày</strong>.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Khu vực phục vụ</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Chúng tôi phục vụ toàn quốc. Liên hệ trực tiếp để được báo giá vận chuyển và lắp đặt chính xác nhất cho khu vực của bạn.
          </p>
        </section>
      </div>
    </main>
  );
}
