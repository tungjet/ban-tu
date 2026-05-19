"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useFavoriteStore } from "@/store/useFavoriteStore";

interface FavoriteButtonProps {
  product: {
    id: string | number;
    name: string;
    price: number;
    oldPrice?: number | null;
    image: string;
    slug?: string | null;
  };
}

export function FavoriteButton({ product }: FavoriteButtonProps) {
  const { items, toggleFavorite } = useFavoriteStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isFavorited = mounted && items.some((item) => item.id === product.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <button
      onClick={handleToggle}
      className={`transition-all duration-300 p-2.5 sm:p-3 rounded-full shrink-0 border cursor-pointer ${
        isFavorited
          ? "text-red-500 bg-red-50 border-red-200 shadow-sm shadow-red-100 scale-105"
          : "text-slate-400 hover:text-red-500 hover:bg-red-50 border-slate-100 hover:border-red-100"
      }`}
      aria-label={isFavorited ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
    >
      <Heart
        className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
          isFavorited ? "fill-red-500 scale-110" : "scale-100"
        } group-hover:scale-110 active:scale-125`}
      />
    </button>
  );
}
