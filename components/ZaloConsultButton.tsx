"use client";

import { ZaloIcon } from "@/components/ZaloIcon";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export function ZaloConsultButton() {
  const { settings } = useStoreSettings();
  const zaloNumber = settings.zalo.replace(/\D/g, "");
  const zaloHref = zaloNumber ? `https://zalo.me/${zaloNumber}` : "#";

  return (
    <a
      href={zaloHref}
      target={zaloNumber ? "_blank" : undefined}
      rel={zaloNumber ? "noreferrer" : undefined}
      aria-disabled={!zaloNumber}
      onClick={(event) => {
        if (!zaloNumber) event.preventDefault();
      }}
      className={`w-full py-3.5 sm:py-4 mt-3 sm:mt-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-100/50 hover:shadow-lg hover:shadow-blue-200/50 group text-sm sm:text-base ${
        zaloNumber
          ? "bg-[#0068ff] hover:bg-[#0056d6] hover:-translate-y-0.5"
          : "bg-slate-300 cursor-not-allowed"
      }`}
    >
      <ZaloIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform shrink-0" />
      Chat Zalo nhận tư vấn kích thước
    </a>
  );
}

