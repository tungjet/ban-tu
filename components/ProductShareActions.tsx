"use client";

import { Check, Copy, Share2 } from "lucide-react";
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

function ZaloIcon() {
  return (
    <svg
      id="svg_zalo_icon"
      aria-hidden="true"
      viewBox="0 0 614.501 613.667"
      className="h-5 w-5"
      xmlSpace="preserve"
    >
      <path
        fill="#0068FF"
        d="M464.721,301.399c-13.984-0.014-23.707,11.478-23.944,28.312c-0.251,17.771,9.168,29.208,24.037,29.202   c14.287-0.007,23.799-11.095,24.01-27.995C489.028,313.536,479.127,301.399,464.721,301.399z"
      />
      <path
        fill="#0068FF"
        d="M291.83,301.392c-14.473-0.316-24.578,11.603-24.604,29.024c-0.02,16.959,9.294,28.259,23.496,28.502   c15.072,0.251,24.592-10.87,24.539-28.707C315.214,313.318,305.769,301.696,291.83,301.392z"
      />
      <path
        fill="#0068FF"
        d="M310.518,3.158C143.102,3.158,7.375,138.884,7.375,306.3s135.727,303.142,303.143,303.142   c167.415,0,303.143-135.727,303.143-303.142S477.933,3.158,310.518,3.158z M217.858,391.083   c-33.364,0.818-66.828,1.353-100.133-0.343c-21.326-1.095-27.652-18.647-14.248-36.583c21.55-28.826,43.886-57.065,65.792-85.621   c2.546-3.305,6.214-5.996,7.15-12.705c-16.609,0-32.784,0.04-48.958-0.013c-19.195-0.066-28.278-5.805-28.14-17.652   c0.132-11.768,9.175-17.329,28.397-17.348c25.159-0.026,50.324-0.06,75.476,0.026c9.637,0.033,19.604,0.105,25.304,9.789   c6.22,10.561,0.284,19.512-5.646,27.454c-21.26,28.497-43.015,56.624-64.559,84.902c-2.599,3.41-5.119,6.88-9.453,12.725   c23.424,0,44.123-0.053,64.816,0.026c8.674,0.026,16.662,1.873,19.941,11.267C237.892,379.329,231.368,390.752,217.858,391.083z    M350.854,330.211c0,13.417-0.093,26.841,0.039,40.265c0.073,7.599-2.599,13.647-9.512,17.084   c-7.296,3.642-14.71,3.028-20.304-2.968c-3.997-4.281-6.214-3.213-10.488-0.422c-17.955,11.728-39.908,9.96-56.597-3.866   c-29.928-24.789-30.026-74.803-0.211-99.776c16.194-13.562,39.592-15.462,56.709-4.143c3.951,2.619,6.201,4.815,10.396-0.053   c5.39-6.267,13.055-6.761,20.271-3.357c7.454,3.509,9.935,10.165,9.776,18.265C350.67,304.222,350.86,317.217,350.854,330.211z    M395.617,369.579c-0.118,12.837-6.398,19.783-17.196,19.908c-10.779,0.132-17.593-6.966-17.646-19.512   c-0.179-43.352-0.185-86.696,0.007-130.041c0.059-12.256,7.302-19.921,17.896-19.222c11.425,0.752,16.992,7.448,16.992,18.833   c0,22.104,0,44.216,0,66.327C395.677,327.105,395.828,348.345,395.617,369.579z M463.981,391.868   c-34.399-0.336-59.037-26.444-58.786-62.289c0.251-35.66,25.304-60.713,60.383-60.396c34.631,0.304,59.374,26.306,58.998,61.986   C524.207,366.492,498.534,392.205,463.981,391.868z"
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
