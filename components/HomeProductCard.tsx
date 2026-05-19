"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Zap } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import { CardFavoriteButton } from "./CardFavoriteButton";

interface HomeProductCardProps {
  product: {
    id: string;
    name: string;
    price: string | number;
    original_price?: string | number | null;
    image_url?: string | null;
    slug?: string | null;
    rating?: number | null;
    sold?: number | null;
  };
}

export function HomeProductCard({ product }: HomeProductCardProps) {
  const { addItem, toggleCart } = useCartStore();
  const router = useRouter();

  const price = Number(product.price);
  const originalPrice = Number(product.original_price) || 0;
  const hasDiscount = originalPrice > price;
  const discountPercent = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;
  const href = `/san-pham/${product.slug || product.id}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price,
      oldPrice: hasDiscount ? originalPrice : null,
      image: product.image_url || "/cat-tu.png",
    });
    toggleCart(true);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price,
      oldPrice: hasDiscount ? originalPrice : null,
      image: product.image_url || "/cat-tu.png",
    });
    router.push("/thanh-toan");
  };

  return (
    <div className="group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <Link href={href} className="block relative aspect-4/5 bg-slate-100 overflow-hidden">
        <Image
          src={product.image_url || "/cat-tu.png"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </div>
        )}
        <CardFavoriteButton
          product={{
            id: product.id,
            name: product.name,
            price,
            oldPrice: hasDiscount ? originalPrice : null,
            image: product.image_url || "/cat-tu.png",
            slug: product.slug,
          }}
        />
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-amber-400 mb-1">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-slate-600 text-xs font-medium ml-1">
            {Number(product.rating ?? 5).toFixed(1)}
          </span>
          <span className="text-slate-400 text-xs ml-1">({product.sold ?? 0})</span>
        </div>
        <Link
          href={href}
          className="font-medium text-slate-900 text-sm mb-1 line-clamp-2 hover:text-blue-600"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <span className="text-red-600 font-bold block">{price.toLocaleString("vi-VN")}đ</span>
            {hasDiscount && (
              <span className="text-slate-400 text-xs line-through block">
                {originalPrice.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
              title="Thêm vào giỏ"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              onClick={handleBuyNow}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm shadow-blue-200 shrink-0"
              title="Mua ngay"
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
