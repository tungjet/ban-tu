"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export function FooterClient() {
  const { settings } = useStoreSettings();

  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/\D/g, "")}` : "#";
  const zaloHref = settings.zalo
    ? `https://zalo.me/${settings.zalo.replace(/\D/g, "")}`
    : "#";
  const facebookHref = settings.facebook || "#";

  return (
    <>
      {/* Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <Image
              src="/logo.png"
              alt="Tủ Nhựa Giá Rẻ"
              width={180}
              height={56}
              className="h-10 sm:h-12 w-auto object-contain invert brightness-0 filter mb-3 sm:mb-4"
            />
            <p className="text-sm leading-relaxed mb-4">
              Giải pháp nội thất thông minh, bền bỉ với thời gian. Chuyên các sản phẩm từ nhựa cao cấp và nhôm kính.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm">
              {settings.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <a href={phoneHref} className="hover:text-white transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.zalo && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <a href={zaloHref} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    Zalo: {settings.zalo}
                  </a>
                </li>
              )}
              {settings.facebook && (
                <li className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <a href={facebookHref} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </li>
              )}
              {!settings.phone && !settings.zalo && !settings.facebook && !settings.address && (
                <li className="text-slate-500 italic text-xs">Chưa cập nhật thông tin liên hệ</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4">Chính sách</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/chinh-sach/bao-hanh" className="hover:text-white transition-colors">Bảo hành &amp; Đổi trả</Link></li>
              <li><Link href="/chinh-sach/van-chuyen" className="hover:text-white transition-colors">Vận chuyển &amp; Lắp đặt</Link></li>
              <li><Link href="/chinh-sach/bao-mat" className="hover:text-white transition-colors">Bảo mật thông tin</Link></li>
              <li><Link href="/admin" className="hover:text-white text-slate-500">Trang quản trị</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-slate-500">
          © {new Date().getFullYear()} Tủ Nhựa Giá Rẻ. All rights reserved.
        </div>
      </footer>

      {/* Floating Action Buttons — tránh bị che bởi thanh điều hướng iOS */}
      <div className="fixed bottom-6 right-4 sm:right-6 flex flex-col gap-2.5 sm:gap-3 z-50" style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        {settings.zalo && (
          <a
            href={zaloHref}
            target="_blank"
            rel="noreferrer"
            title={`Zalo: ${settings.zalo}`}
            className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </a>
        )}
        {settings.facebook && (
          <a
            href={facebookHref}
            target="_blank"
            rel="noreferrer"
            title="Facebook"
            className="bg-blue-700 text-white p-3 rounded-full shadow-lg hover:bg-blue-800 hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        )}
        {settings.phone && (
          <a
            href={phoneHref}
            title={`Gọi: ${settings.phone}`}
            className="bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
          </a>
        )}
      </div>
    </>
  );
}
