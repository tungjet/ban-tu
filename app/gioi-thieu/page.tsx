import type { Metadata } from "next";
import { GioiThieuClient } from "./GioiThieuClient";

export const metadata: Metadata = {
  title: "Giới thiệu Xưởng Tủ Nhựa Nga Vương | Giá Rẻ Tận Gốc",
  description: "Xưởng Tủ Nhựa Nga Vương chuyên thiết kế & thi công tủ quần áo, giường, tủ bếp nhựa Đài Loan, Ecoplast cao cấp. Giá gốc tại xưởng, không qua trung gian, bảo hành 10 năm.",
  keywords: ["xưởng tủ nhựa nga vương", "tủ nhựa nga vương", "tủ nhựa đài loan", "tủ nhựa ecoplast", "tủ nhựa giá rẻ", "thi công tủ nhựa"],
  openGraph: {
    title: "Giới thiệu Xưởng Tủ Nhựa Nga Vương | Chất Lượng Vững Bền",
    description: "Giải pháp nội thất nhựa Ecoplast/Đài Loan hoàn hảo chống mối mọt, chống ẩm mốc 100%. Đo đạc thiết kế theo yêu cầu tận nơi.",
    url: "https://noithatgiare.shop/gioi-thieu",
    siteName: "Tủ Nhựa Giá Rẻ Nga Vương",
    images: [
      {
        url: "/hero-banner.png",
        width: 1200,
        height: 630,
        alt: "Xưởng Tủ Nhựa Nga Vương",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
};

export default function GioiThieuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "name": "Xưởng Tủ Nhựa Nga Vương",
    "image": "https://noithatgiare.shop/hero-banner.png",
    "@id": "https://noithatgiare.shop/gioi-thieu",
    "url": "https://noithatgiare.shop/gioi-thieu",
    "telephone": "0987654321",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Việt Nam",
      "addressLocality": "Hà Nội",
      "addressRegion": "Hà Nội",
      "addressCountry": "VN"
    },
    "description": "Tự hào là đơn vị uy tín sản xuất trực tiếp tủ nhựa Đài Loan, Ecoplast không qua trung gian, mang đến sản phẩm chất lượng nhất với mức giá cạnh tranh nhất thị trường."
  };

  return (
    <main className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GioiThieuClient />
    </main>
  );
}
