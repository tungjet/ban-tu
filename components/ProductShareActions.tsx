"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { ZaloIcon } from "@/components/ZaloIcon";
import { useState } from "react";

interface ProductShareActionsProps {
  title: string;
  description?: string;
}

const buttonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.58 19.2v-6.56h2.2l.33-2.56h-2.53V8.45c0-.74.21-1.25 1.27-1.25h1.36V4.91a18.4 18.4 0 0 0-1.98-.1c-1.96 0-3.3 1.2-3.3 3.39v1.88H8.72v2.56h2.21v6.56h2.65Z"
      />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <defs>
        <linearGradient id="messenger-gradient" x1="4" x2="20" y1="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0099FF" />
          <stop offset="0.6" stopColor="#A033FF" />
          <stop offset="1" stopColor="#FF5280" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#messenger-gradient)" />
      <path
        fill="#fff"
        d="m5.7 12.35 4.54-4.82 2.42 2.57 4.41-2.57-4.83 5.12-2.36-2.57-4.18 2.27Z"
      />
    </svg>
  );
}



function getShareUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href.split("#")[0];
}

function openPopup(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function ProductShareActions({ title, description }: ProductShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const shareText = description || "Xem sản phẩm tại Tủ Nhựa Giá Rẻ";

  const handleNativeShare = async () => {
    const url = getShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await handleCopyLink();
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(getShareUrl());
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const handleMessengerShare = () => {
    const url = encodeURIComponent(getShareUrl());
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

    if (appId) {
      openPopup(
        `https://www.facebook.com/dialog/send?app_id=${encodeURIComponent(appId)}&link=${url}&redirect_uri=${url}`
      );
      return;
    }

    window.location.href = `fb-messenger://share/?link=${url}`;
  };

  const handleZaloShare = () => {
    const url = encodeURIComponent(getShareUrl());
    openPopup(`https://zalo.me/share?u=${url}`);
  };

  const handleCopyLink = async () => {
    await writeClipboard(getShareUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Chia sẻ sản phẩm">
      <button
        type="button"
        onClick={handleNativeShare}
        className={`${buttonClass} sm:hidden bg-blue-600 text-white hover:bg-blue-700 hover:text-white`}
        aria-label="Chia sẻ bằng ứng dụng trên thiết bị"
        title="Chia sẻ"
      >
        <Share2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={handleFacebookShare}
        className={buttonClass}
        aria-label="Chia sẻ lên Facebook"
        title="Facebook"
      >
        <FacebookIcon />
      </button>

      <button
        type="button"
        onClick={handleMessengerShare}
        className={buttonClass}
        aria-label="Gửi qua Messenger"
        title="Messenger"
      >
        <MessengerIcon />
      </button>

      <button
        type="button"
        onClick={handleZaloShare}
        className={`${buttonClass} text-[#0068ff] hover:border-[#0068ff] hover:bg-blue-50`}
        aria-label="Chia sẻ qua Zalo"
        title="Zalo"
      >
        <ZaloIcon />
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        className={`${buttonClass} ${copied ? "border-green-200 bg-green-50 text-green-700" : ""}`}
        aria-label={copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}
        title={copied ? "Đã copy" : "Copy link"}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
