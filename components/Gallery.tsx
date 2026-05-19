"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ShoppingCart, Zap, Eye, Star } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatProductPrice, getNumericPrice } from "@/lib/price";

export interface GalleryProduct {
  id: string;
  name: string;
  price: number | string | null;
  original_price?: number | null;
  image_url?: string | null;
  slug?: string | null;
}

export interface GalleryItem {
  id: string;
  image_url: string;
  title?: string | null;
  description?: string | null;
  product?: GalleryProduct | null;
}

interface GalleryProps {
  items: GalleryItem[];
}

export function Gallery({ items }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const router = useRouter();
  const { addItem, toggleCart } = useCartStore();

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  }, [items.length]);
  const next = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i + 1) % items.length));
  }, [items.length]);

  // Phím tắt: Esc / ← / →
  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, close, prev, next]);

  if (items.length === 0) return null;

  const active = activeIndex !== null ? items[activeIndex] : null;

  const handleAddToCart = (product: GalleryProduct) => {
    const price = getNumericPrice(product.price);
    if (price === null) return;
    addItem({
      id: product.id,
      name: product.name,
      price,
      oldPrice: product.original_price ? Number(product.original_price) : null,
      image: product.image_url || "/cat-tu.png",
    });
    toggleCart(true);
  };

  const handleBuyNow = (product: GalleryProduct) => {
    const price = getNumericPrice(product.price);
    if (price === null) return;
    addItem({
      id: product.id,
      name: product.name,
      price,
      oldPrice: product.original_price ? Number(product.original_price) : null,
      image: product.image_url || "/cat-tu.png",
    });
    close();
    router.push("/thanh-toan");
  };

  return (
    <>
      {/* Masonry-ish grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
        {items.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className="group relative w-full overflow-hidden rounded-2xl bg-slate-100 cursor-pointer break-inside-avoid block"
          >
            <Image
              src={item.image_url}
              alt={item.title || "Ảnh nội thất"}
              width={400}
              height={idx % 5 === 0 ? 600 : 400}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover w-full h-auto transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
              {item.title && (
                <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 mb-1 drop-shadow">
                  {item.title}
                </p>
              )}
              {item.product && (
                <p className="text-blue-200 text-xs font-bold drop-shadow">
                  {formatProductPrice(item.product.price)}
                </p>
              )}
              <span className="text-xs text-white/70 inline-flex items-center gap-1 mt-1">
                <Eye className="w-3 h-3" /> Xem chi tiết
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox / Modal */}
      {active && (
        <div
          className="fixed inset-0 z-120 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={close}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur transition-colors z-10"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev / Next */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur transition-colors z-10"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur transition-colors z-10"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Modal card */}
          <div
            className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl max-h-[92vh] flex flex-col md:flex-row shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ảnh sản phẩm */}
            <div className="relative shrink-0 w-full md:w-[55%] bg-slate-100 min-h-[220px] sm:min-h-[300px] md:min-h-[420px]">
              <Image
                src={active.image_url}
                alt={active.title || "Ảnh nội thất"}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-contain"
                priority
              />
              {/* Discount badge */}
              {active.product?.original_price &&
                getNumericPrice(active.product.price) !== null &&
                Number(active.product.original_price) > getNumericPrice(active.product.price)! && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    -{Math.round(
                      (1 - getNumericPrice(active.product.price)! / Number(active.product.original_price)) * 100
                    )}%
                  </div>
                )}
              {/* Counter */}
              <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur">
                {(activeIndex ?? 0) + 1} / {items.length}
              </div>
            </div>

            {/* Thông tin sản phẩm */}
            <div className="flex-1 flex min-w-0 flex-col overflow-y-auto p-4 sm:p-7">
              {/* Tên sản phẩm */}
              {active.title && (
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-2">
                  {active.title}
                </h3>
              )}

              {/* Rating placeholder */}
              <div className="flex items-center gap-1.5 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs text-slate-500 ml-1">5.0</span>
              </div>

              {/* Giá */}
              {active.product && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4">
                  <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl font-black text-blue-700">
                      {formatProductPrice(active.product.price)}
                    </span>
                    {active.product.original_price &&
                      getNumericPrice(active.product.price) !== null &&
                      Number(active.product.original_price) > getNumericPrice(active.product.price)! && (
                        <span className="text-sm text-slate-400 line-through">
                          {Number(active.product.original_price).toLocaleString("vi-VN")}đ
                        </span>
                      )}
                  </div>
                  {active.product.original_price &&
                    getNumericPrice(active.product.price) !== null &&
                    Number(active.product.original_price) > getNumericPrice(active.product.price)! && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Tiết kiệm{" "}
                        {(
                          Number(active.product.original_price) - getNumericPrice(active.product.price)!
                        ).toLocaleString("vi-VN")}đ
                      </p>
                    )}
                </div>
              )}

              {/* Mô tả */}
              {active.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-5 line-clamp-4">
                  {active.description}
                </p>
              )}

              {/* Actions */}
              {active.product ? (
                <div className="mt-auto flex flex-col gap-2.5 pt-4 border-t border-slate-100">
                  {/* Xem chi tiết */}
                  <Link
                    href={`/san-pham/${active.product.slug || active.product.id}`}
                    onClick={close}
                    className="w-full py-3 px-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Xem chi tiết sản phẩm
                  </Link>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Thêm vào giỏ */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(active.product!)}
                      disabled={getNumericPrice(active.product.price) === null}
                      className="py-3 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Vào giỏ hàng
                    </button>

                    {/* Mua ngay */}
                    <button
                      type="button"
                      onClick={() => handleBuyNow(active.product!)}
                      disabled={getNumericPrice(active.product.price) === null}
                      className="py-3 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-200/60 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      Mua ngay
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-4 border-t border-slate-100 text-sm text-slate-400 italic">
                  Ảnh tham khảo, chưa được liên kết với sản phẩm cụ thể.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
