"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

import { useRouter } from "next/navigation";

interface ProductActionsProps {
  product: {
    id: string | number;
    name: string;
    price: number;
    oldPrice?: number | null;
    image: string;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const { addItem } = useCartStore();
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    router.push('/thanh-toan');
  };

  return (
    <div className="flex gap-1 sm:gap-2">
      <button 
        onClick={handleAddToCart}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0" 
        title="Thêm vào giỏ"
      >
        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
      <button 
        onClick={handleBuyNow}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm shadow-blue-200 shrink-0" 
        title="Mua ngay"
      >
        <Zap className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
      </button>
    </div>
  );
}
