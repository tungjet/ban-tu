"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useFavoriteStore } from "@/store/useFavoriteStore";

interface CardFavoriteButtonProps {
  product: {
    id: string | number;
    name: string;
    price: number;
    oldPrice?: number | null;
    image: string;
    slug?: string | null;
  };
  className?: string;
}

export function CardFavoriteButton({ product, className = "" }: CardFavoriteButtonProps) {
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
      className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-md border cursor-pointer ${
        isFavorited
          ? "bg-red-50 border-red-100 text-red-500 scale-105"
          : "bg-white/90 backdrop-blur-xs border-slate-100 text-slate-400 hover:text-red-500 hover:scale-105"
      } ${className}`}
      aria-label={isFavorited ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
    >
      <Heart
        className={`w-4.5 h-4.5 transition-all duration-300 ${
          isFavorited ? "fill-red-500 scale-110" : "scale-100"
        } active:scale-125`}
      />
    </button>
  );
}
