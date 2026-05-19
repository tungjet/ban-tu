"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

import { useRouter } from "next/navigation";

interface PDPProductActionsProps {
  product: {
    id: string | number;
    name: string;
    price: number | null;
    oldPrice?: number | null;
    image: string;
  };
}

export function PDPProductActions({ product }: PDPProductActionsProps) {
  const { addItem } = useCartStore();
  const router = useRouter();

  const handleAddToCart = () => {
    if (product.price === null) return;
    addItem({ ...product, price: product.price });
  };

  const handleBuyNow = () => {
    if (product.price === null) return;
    addItem({ ...product, price: product.price });
    router.push('/thanh-toan');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-auto">
      <button 
        onClick={handleAddToCart}
        disabled={product.price === null}
        className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 group text-sm sm:text-base"
      >
        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Thêm vào giỏ
      </button>
      <button 
        onClick={handleBuyNow}
        disabled={product.price === null}
        className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:hover:from-blue-600 disabled:hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200/50 transition-all flex items-center justify-center gap-2 group hover:-translate-y-0.5 disabled:hover:translate-y-0 text-sm sm:text-base"
      >
        <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
        Mua ngay
      </button>
    </div>
  );
}
