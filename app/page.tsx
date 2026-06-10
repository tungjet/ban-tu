import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Droplets,
  BugOff,
  Sparkles,
  Wind,
  Leaf,
  Award,
  Heart,
  Truck,
  HardHat,
  ShoppingBag,
} from "lucide-react";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { Testimonial } from "@/lib/models/Testimonial";
import { HomepageFeature } from "@/lib/models/HomepageFeature";
import { Gallery, type GalleryItem } from "@/components/Gallery";
import { HomeProductCard } from "@/components/HomeProductCard";

export const metadata: Metadata = {
  title: "Tủ Nhựa Giá Rẻ | Nội thất cao cấp, chống nước 100%",
  description: "Tủ Nhựa Giá Rẻ chuyên cung cấp tủ quần áo, giường ngủ, tủ bếp từ nhựa Đài Loan, Ecoplast và nhôm kính cao cấp. Thiết kế hiện đại, độ bền 10 năm, miễn phí lắp đặt.",
  keywords: ["tủ nhựa giá rẻ", "nội thất nhựa", "tủ quần áo nhựa", "giường nhựa", "tủ bếp nhôm", "nội thất ecoplast", "bantu"],
  openGraph: {
    title: "Tủ Nhựa Giá Rẻ | Nội thất nhựa và nhôm cao cấp",
    description: "Giải pháp nội thất hoàn hảo chống mối mọt, chống nước 100% cho gia đình bạn.",
    url: "https://noithatgiare.shop",
    siteName: "Tủ Nhựa Giá Rẻ",
    images: [
      {
        url: "/hero-banner.png",
        width: 1200,
        height: 630,
        alt: "Tủ Nhựa Giá Rẻ",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
};

// Map icon name (lưu trong DB) -> component lucide-react
const FEATURE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  droplets: Droplets,
  "bug-off": BugOff,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  wind: Wind,
  leaf: Leaf,
  award: Award,
  heart: Heart,
  truck: Truck,
  "hard-hat": HardHat,
};

const FEATURE_THEMES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
};

export default async function Home() {
  await connectDB();
  const [productsRaw, categoriesRaw, featuresRaw, testimonialsRaw, galleryProductsRaw] = await Promise.all([
    Product.find({ isPublished: true }).sort({ createdAt: -1 }).lean(),
    Category.find().sort({ displayOrder: 1 }).limit(8).lean(),
    HomepageFeature.find({ isPublished: true }).sort({ displayOrder: 1 }).lean(),
    Testimonial.find({ isPublished: true }).sort({ displayOrder: 1 }).limit(6).lean(),
    Product.find({ isPublished: true })
      .select("name slug price originalPrice imageUrl images description")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  type ProductForGallery = {
    _id: { toString(): string };
    name: string;
    slug?: string | null;
    price: number | string | null;
    originalPrice?: number | string | null;
    imageUrl?: string | null;
    images?: string[] | null;
    description?: string | null;
  };
  const galleryItems: GalleryItem[] = [];
  for (const p of (galleryProductsRaw as unknown as ProductForGallery[])) {
    const productImages = (p.images && p.images.length > 0)
      ? p.images
      : p.imageUrl
        ? [p.imageUrl]
        : [];
    productImages.forEach((img, idx) => {
      galleryItems.push({
        id: `${p._id.toString()}-${idx}`,
        image_url: img,
        title: p.name,
        description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 140),
        product: {
          id: p._id.toString(),
          name: p.name,
          slug: p.slug ?? null,
          price: p.price ?? null,
          original_price: p.originalPrice ? Number(p.originalPrice) : null,
          image_url: p.imageUrl ?? null,
        },
      });
    });
  }
  const galleryDisplay = galleryItems.slice(0, 16);

  type ProductLean = { _id: { toString(): string }; name: string; price: number | string | null; imageUrl?: string | null; slug?: string | null; originalPrice?: number | string | null; rating?: number; sold?: number };
  const products = (productsRaw as unknown as ProductLean[]).map((p) => ({
    id: p._id.toString(),
    name: p.name,
    price: p.price ?? null,
    image_url: p.imageUrl ?? null,
    slug: p.slug ?? null,
    original_price: p.originalPrice ?? null,
    rating: p.rating ?? 5,
    sold: p.sold ?? 0,
  }));

  type CategoryLean = { _id: { toString(): string }; name: string; slug: string; imageUrl?: string | null };
  const categories = (categoriesRaw as unknown as CategoryLean[]).map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    image_url: c.imageUrl ?? null,
  }));

  type FeatureLean = { _id: { toString(): string }; icon?: string; title: string; description: string; colorTheme?: string };
  const features = (featuresRaw as unknown as FeatureLean[]).map((f) => ({
    id: f._id.toString(),
    icon: f.icon,
    title: f.title,
    description: f.description,
    color_theme: f.colorTheme,
  }));

  type TestimonialLean = { _id: { toString(): string }; customerName: string; initial?: string; productLabel?: string; rating?: number; content: string };
  const testimonials = (testimonialsRaw as unknown as TestimonialLean[]).map((t) => ({
    id: t._id.toString(),
    customer_name: t.customerName,
    initial: t.initial,
    product_label: t.productLabel,
    rating: t.rating ?? 5,
    content: t.content,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "name": "Tủ Nhựa Giá Rẻ",
    "image": "https://noithatgiare.shop/hero-banner.png",
    "@id": "https://noithatgiare.shop",
    "url": "https://noithatgiare.shop",
    "telephone": "0987654321", // TODO: Update with real number if available
    "priceRange": "VND",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Việt Nam",
      "addressLocality": "Hà Nội",
      "addressRegion": "Hà Nội",
      "addressCountry": "VN"
    },
    "description": "Tủ Nhựa Giá Rẻ chuyên cung cấp tủ quần áo, giường ngủ, tủ bếp từ nhựa Đài Loan, Ecoplast và nhôm kính cao cấp. Thiết kế hiện đại, độ bền 10 năm, miễn phí lắp đặt.",
    "sameAs": [
      "https://www.facebook.com/noithatngavuong",
      "https://zalo.me/"
    ]
  };

  return (
    <main className="flex flex-col items-center w-full bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Hero Section */}
      <section className="relative w-full h-[480px] sm:h-[560px] md:h-[650px] overflow-hidden">
        <Image
          src="/hero-banner.png"
          alt="Nội thất cao cấp Tủ Nhựa Giá Rẻ"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-20 sm:bottom-24 left-0 w-full px-5 sm:px-8 md:px-12 md:max-w-2xl text-white">
          <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider text-blue-900 bg-blue-100 rounded-full">
            BỘ SƯU TẬP 2026
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 leading-tight">
            Nâng tầm không gian sống của bạn
          </h1>
          <p className="text-sm md:text-base text-slate-200 mb-5 max-w-md line-clamp-3 sm:line-clamp-none">
            Khám phá các dòng sản phẩm tủ, giường nhựa Đài Loan & Ecoplast bền bỉ, hiện đại, giá thành hợp lý.
          </p>
          <Link href="/san-pham?sort=moinhat" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg inline-flex items-center justify-center gap-2 transition-colors">
            Xem mẫu mới nhất
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-12 sm:-mt-20 pb-16 flex flex-col gap-10 sm:gap-16">

        {/* 2. Tất cả sản phẩm */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-md">
              Tất cả sản phẩm
              {products.length > 0 && (
                <span className="ml-2 text-sm sm:text-base font-medium text-white/80 drop-shadow-md">
                  ({products.length})
                </span>
              )}
            </h2>
            <Link href="/san-pham" className="text-white text-sm font-medium hover:underline flex items-center drop-shadow-md shrink-0">
              Lọc & sắp xếp <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
            {products.map((product: { id: string; name: string; price: string | number | null; image_url: string | null; slug: string | null; original_price: string | number | null; rating: number; sold: number }) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && (
              <div className="col-span-full">
                <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm border border-white/60 shadow-xl px-6 py-14 flex flex-col items-center text-center">
                  {/* Decorative blobs */}
                  <div className="absolute -top-10 -left-10 w-56 h-56 bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-70" />
                  <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-cyan-100 rounded-full blur-3xl pointer-events-none opacity-70" />

                  {/* Icon */}
                  <div className="relative w-20 h-20 mb-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-md">
                    <ShoppingBag className="w-9 h-9 text-blue-400" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow">
                      <Sparkles className="w-3 h-3 text-white" />
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">Sản phẩm sắp ra mắt</h3>
                  <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
                    Chúng tôi đang chuẩn bị những sản phẩm tuyệt vời nhất. Hãy quay lại sớm nhé!
                  </p>

                  <Link
                    href="/san-pham"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-colors shadow-lg shadow-blue-200"
                  >
                    Khám phá ngay <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Danh mục sản phẩm - lấy từ DB */}
        {categories.length > 0 && (
          <section className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Khám phá danh mục</h2>
              <Link href="/danh-muc" className="text-blue-600 text-sm font-medium hover:underline flex items-center shrink-0">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 gap-3 sm:gap-4 snap-x hide-scrollbar">
              {categories.map((category: { id: string; name: string; slug: string; image_url: string | null }) => (
                <Link
                  key={category.id}
                  href={`/san-pham?category=${category.slug || category.id}`}
                  className="flex-none w-24 sm:w-36 group snap-start text-center"
                >
                  <div className="relative w-full aspect-square rounded-full overflow-hidden mb-2 bg-slate-100 border-4 border-transparent group-hover:border-blue-100 transition-all">
                    <Image
                      src={category.image_url || "/cat-tu.png"}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-medium text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Tại sao chọn Bantu (Features) - lấy từ DB */}
        {features.length > 0 && (
          <section className="bg-white rounded-3xl p-5 sm:p-12 shadow-sm border border-slate-100">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Ưu điểm nội thất nhựa & nhôm</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">Vật liệu thay thế hoàn hảo cho gỗ công nghiệp, giải quyết triệt để các vấn đề của thời tiết nhiệt đới gió mùa.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature: { id: string; icon?: string; title: string; description: string; color_theme?: string }) => {
                const Icon = FEATURE_ICONS[feature.icon || "shield-check"] || ShieldCheck;
                const themeClass = FEATURE_THEMES[feature.color_theme || "blue"] || FEATURE_THEMES.blue;
                return (
                  <div key={feature.id} className="flex sm:flex-col items-start sm:items-center sm:text-center gap-4 sm:gap-0">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 ${themeClass} rounded-2xl flex items-center justify-center shrink-0 sm:mb-4`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-slate-900">{feature.title}</h3>
                      <p className="text-slate-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Gallery - thư viện ảnh nội thất */}
        {galleryDisplay.length > 0 && (
          <section className="bg-white rounded-3xl p-4 sm:p-10 shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Thư viện nội thất</h2>
                <p className="text-xs sm:text-sm text-slate-500">Bấm vào ảnh để xem chi tiết và đặt mua</p>
              </div>
            </div>
            <Gallery items={galleryDisplay} />
          </section>
        )}

        {/* 6. Đánh giá từ khách hàng - lấy từ DB */}
        {testimonials.length > 0 && (
          <section className="bg-blue-50 rounded-3xl p-5 sm:p-12 shadow-sm text-slate-900 border border-blue-100">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3">Khách hàng nói gì về Tủ Nhựa Giá Rẻ</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">Vài nhận xét chân thực từ những khách hàng đã trực tiếp trải nghiệm sản phẩm của chúng tôi.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {testimonials.slice(0, 3).map((t: { id: string; customer_name: string; initial?: string; product_label?: string; rating?: number; content: string }) => {
                const stars = Math.max(1, Math.min(5, t.rating ?? 5));
                const initial = (t.initial || t.customer_name || "?").trim().charAt(0).toUpperCase();
                return (
                  <div key={t.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 fill-current ${i < stars ? "" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed italic">&ldquo;{t.content}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 shrink-0">
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-slate-900">{t.customer_name}</h4>
                        {t.product_label && (
                          <p className="text-xs text-slate-500 line-clamp-1">{t.product_label}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>


    </main>
  );
}
