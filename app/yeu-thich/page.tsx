"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Home, ShoppingCart, Trash2, ChevronRight } from "lucide-react";
import { useFavoriteStore, FavoriteItem } from "@/store/useFavoriteStore";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";

export default function FavoritesPage() {
  const { items, removeFavorite, clearFavorites } = useFavoriteStore();
  const { addItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <main className="w-full bg-slate-50 min-h-screen flex items-center justify-center text-slate-500">
        Đang tải dữ liệu...
      </main>
    );
  }

  const handleAddToCart = (item: FavoriteItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      oldPrice: item.oldPrice,
      image: item.image,
    });
    toast.success(`Đã thêm ${item.name} vào giỏ hàng!`);
  };

  const handleRemoveFavorite = (id: string | number, name: string) => {
    removeFavorite(id);
    toast.success(`Đã xóa ${name} khỏi danh sách yêu thích!`);
  };

  return (
    <main className="w-full bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-sm text-slate-500 overflow-x-auto hide-scrollbar whitespace-nowrap">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" />
              Trang chủ
            </Link>
            <span className="mx-2"><ChevronRight className="w-3 h-3" /></span>
            <span className="text-slate-900 font-medium">Sản phẩm yêu thích</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" /> Sản phẩm yêu thích
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Danh sách những sản phẩm bạn đã lưu để xem lại sau
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => {
                clearFavorites();
                toast.success("Đã xóa tất cả sản phẩm yêu thích!");
              }}
              className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold cursor-pointer transition-all"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-xl mx-auto mt-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-400 mb-6 relative shadow-inner animate-pulse">
              <Heart className="w-10 h-10 fill-red-400/20" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Danh sách yêu thích trống</h2>
            <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
              Bạn chưa lưu sản phẩm nào vào danh sách yêu thích cả. Hãy khám phá và lưu những món đồ bạn yêu thích nhé!
            </p>
            <Link
              href="/san-pham"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => {
              const hasDiscount = !!(item.oldPrice && item.oldPrice > item.price);
              const discountPercent = hasDiscount && item.oldPrice
                ? Math.round((1 - item.price / item.oldPrice) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  className="group relative border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFavorite(item.id, item.name)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs shadow-md border border-slate-100 text-slate-400 hover:text-red-500 hover:scale-110 flex items-center justify-center transition-all cursor-pointer"
                    title="Xóa khỏi yêu thích"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/san-pham/${item.slug || item.id}`}
                    className="block relative aspect-4/5 bg-slate-100 overflow-hidden"
                  >
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {hasDiscount && discountPercent > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{discountPercent}%
                      </div>
                    )}
                  </Link>

                  <div className="p-4 flex flex-col flex-1">
                    <Link
                      href={`/san-pham/${item.slug || item.id}`}
                      className="font-medium text-slate-900 text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>

                    <div className="mt-auto pt-2 flex flex-col gap-3">
                      <div>
                        <span className="text-red-600 font-bold block text-sm sm:text-base">
                          {item.price.toLocaleString("vi-VN")}đ
                        </span>
                        {hasDiscount && item.oldPrice && (
                          <span className="text-slate-400 text-xs line-through block">
                            {item.oldPrice.toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
