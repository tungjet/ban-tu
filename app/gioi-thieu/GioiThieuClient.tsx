"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  DollarSign, 
  Ruler, 
  Palette, 
  Wrench, 
  Truck, 
  Sparkles, 
  PhoneCall, 
  ChevronRight,
  HelpCircle,
  Clock
} from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export function GioiThieuClient() {
  const { settings } = useStoreSettings();

  const phoneDisplay = settings.phone || "0987.654.321";
  const phoneHref = `tel:${phoneDisplay.replace(/\D/g, "")}`;
  const zaloHref = settings.zalo 
    ? `https://zalo.me/${settings.zalo.replace(/\D/g, "")}`
    : `https://zalo.me/${phoneDisplay.replace(/\D/g, "")}`;
  const facebookHref = settings.facebook || "#";
  const addressDisplay = settings.address || "Địa chỉ xưởng của chúng tôi";

  const advantages = [
    {
      icon: DollarSign,
      title: "Giá rẻ tận gốc tại xưởng",
      description: "Là đơn vị sản xuất trực tiếp, tối ưu hóa mọi chi phí từ nguyên liệu đến nhân công, đảm bảo mức giá mềm nhất không qua khâu trung gian thương mại.",
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      icon: ShieldCheck,
      title: "Nhựa cao cấp (Đài Loan/Ecoplast)",
      description: "100% chống mối mọt, chống nước tuyệt đối, không cong vênh. Nhựa dày dặn chịu lực tốt, độ bền cao từ 10 - 15 năm và an toàn tuyệt đối cho trẻ nhỏ.",
      colorClass: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      icon: Ruler,
      title: "Đo đạc & Thiết kế theo yêu cầu",
      description: "Nhận thiết kế riêng tủ quần áo người lớn, tủ trẻ em, tủ âm tường, kệ tivi, tủ bếp... vừa vặn hoàn hảo với từng centimet không gian căn phòng.",
      colorClass: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      icon: Palette,
      title: "Màu sắc phong phú, đa dạng",
      description: "Lựa chọn từ các tông màu giả gỗ sang trọng, vân gỗ hiện đại ấm cúng cho đến các gam màu tươi sáng, sinh động, kích thích sự sáng tạo cho bé yêu.",
      colorClass: "bg-purple-50 text-purple-600 border-purple-100",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: PhoneCall,
      title: "Tư vấn & Báo giá",
      description: "Lắng nghe nhu cầu cụ thể của khách hàng, tư vấn chất liệu (Đài Loan/Ecoplast) và mẫu mã phù hợp nhất với ngân sách tối ưu.",
    },
    {
      number: "02",
      icon: Ruler,
      title: "Khảo sát & Đo đạc",
      description: "Đội ngũ kỹ thuật đến tận nhà đo đạc kích thước thực tế để lên phương án thiết kế chuẩn xác từng góc cạnh.",
    },
    {
      number: "03",
      icon: Wrench,
      title: "Gia công thần tốc",
      description: "Những người thợ lành nghề tiến hành pha cắt, ráp tủ tỉ mỉ bằng trang thiết bị chuyên dụng, hoàn thiện sản phẩm nhanh chóng.",
    },
    {
      number: "04",
      icon: Truck,
      title: "Giao hàng & Lắp đặt",
      description: "Vận chuyển tận nơi, lắp đặt gọn gàng, bàn giao hoàn thiện và vệ sinh sạch sẽ không gian phòng trước khi ra về.",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="relative bg-slate-900 text-white overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/20 mb-6 uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Trực tiếp tại xưởng sản xuất
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent mb-6">
            XƯỞNG TỦ NHỰA NGA VƯƠNG
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-medium mb-8 leading-relaxed">
            Giải pháp nội thất nhựa Đài Loan & Ecoplast cao cấp. Bền bỉ vượt thời gian, chống mối mọt, chống ẩm mốc 100% với giá gốc tại xưởng!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={phoneHref}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 hover:scale-105"
            >
              <Phone className="w-5 h-5" /> Gọi báo giá ngay
            </a>
            <a
              href={zaloHref}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl transition-all flex items-center gap-2 backdrop-blur-xs hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 text-sky-400" /> Chat qua Zalo
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-100/80">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold text-blue-600 bg-blue-50">
                <HelpCircle className="w-4 h-4" /> Bạn đang tìm kiếm tủ quần áo phù hợp?
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight">
                Không còn lo lắng về mối mọt, ẩm mốc hay cong vênh!
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Bạn đang tìm kiếm một chiếc tủ quần áo vừa bền, đẹp, hiện đại lại phải phù hợp với túi tiền? Bạn e ngại các loại tủ gỗ ép dễ ẩm mốc, bong tróc hoặc bị mối mọt tấn công chỉ sau một thời gian ngắn sử dụng?
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                Hãy để <strong className="text-blue-600 font-semibold">Xưởng Tủ Nhựa Nga Vương</strong> giải quyết triệt để mối lo đó cho bạn! Tự hào là đơn vị uy tín trong lĩnh vực thiết kế và thi công nội thất nhựa, chúng tôi cam kết mang đến cho không gian sống của bạn những sản phẩm chất lượng vượt trội với mức giá cạnh tranh nhất thị trường.
              </p>
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-x-8 gap-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Chống nước 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Không lo mối mọt</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Bảo hành dài hạn</span>
                </div>
              </div>
            </div>
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-square rounded-2xl overflow-hidden shadow-md group">
              <Image
                src="/cat-tu.png"
                alt="Thi công tủ nhựa cao cấp Nga Vương"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-6">
                <div className="text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1">Dòng tủ quần áo cao cấp</p>
                  <h3 className="text-lg font-bold">Chất liệu nhựa Ecoplast dày dặn siêu bền</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Tại Sao Nên Chọn Tủ Nhựa Tại Xưởng Nga Vương?
          </h2>
          <p className="text-slate-500 text-sm sm:text-base">
            Thay vì mua qua các cửa hàng thương mại với chi phí đắt đỏ, khi đến với Xưởng Nga Vương, bạn sẽ được trải nghiệm dịch vụ và sản phẩm tuyệt vời nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {advantages.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-xs hover:shadow-lg transition-all duration-300 flex gap-5 items-start group hover:-translate-y-1"
              >
                <div className={`p-4 rounded-xl shrink-0 border ${item.colorClass} group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-900 text-white py-16 sm:py-24 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Quy Trình Làm Việc Chuyên Nghiệp
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Chúng tôi luôn tối ưu hóa quy trình từ khâu tiếp nhận thông tin cho đến khi bàn giao sản phẩm hoàn chỉnh để tiết kiệm thời gian tối đa cho quý khách.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 relative group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <StepIcon className="w-7 h-7" />
                    <span className="absolute -top-3.5 -right-3.5 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center border-2 border-slate-900">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-16 text-white relative overflow-hidden shadow-xl shadow-blue-900/10">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/20 mb-4 uppercase">
              <Sparkles className="w-3 h-3" /> Quà tặng ý nghĩa
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-6">
              Ưu Đãi Đặc Biệt Khi Đặt Hàng Hôm Nay
            </h2>
            <div className="space-y-4 text-slate-100 text-sm sm:text-base font-medium">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                </div>
                <p>Miễn phí vận chuyển và lắp đặt chuyên nghiệp trong khu vực nội thành.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                </div>
                <p>Bảo hành chất lượng nhựa uy tín lâu dài, hỗ trợ kỹ thuật tận tâm trọn đời trong quá trình sử dụng.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                </div>
                <p>Ưu đãi chiết khấu vô cùng hấp dẫn khi quý khách đặt làm combo trọn gói Giường + Tủ hoặc đơn hàng số lượng lớn cho căn hộ dịch vụ, phòng trọ cao cấp, chung cư mini.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-100 text-center">
          <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full mb-6">
            <PhoneCall className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Liên Hệ Với Xưởng Nga Vương!
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mb-8">
            Đừng ngần ngại làm mới và tối ưu hóa không gian sống của bạn ngay hôm nay với chi phí tốt nhất thị trường!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4 items-start">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Địa chỉ xưởng</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{addressDisplay}</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4 items-start">
              <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Hotline / Zalo</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{phoneDisplay}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={phoneHref}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-105"
            >
              <Phone className="w-4 h-4" /> Gọi ngay: {phoneDisplay}
            </a>
            <a
              href={zaloHref}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-105"
            >
              <MessageCircle className="w-4 h-4" /> Liên hệ Zalo
            </a>
            {facebookHref && facebookHref !== "#" && (
              <a
                href={facebookHref}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-105"
              >
                Fanpage Facebook
              </a>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-8 font-medium">
            Xưởng Tủ Nhựa Nga Vương – Chất lượng vững bền, giá mềm cho mọi nhà!
          </p>
        </div>
      </section>
    </div>
  );
}
