"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Zap, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface PDPImageGalleryProps {
  images: string[];
  productName: string;
  discountPercent?: number;
  hasDiscount?: boolean;
}

export function PDPImageGallery({ images, productName, discountPercent, hasDiscount }: PDPImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, handlePrev, handleNext]);

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Ảnh chính */}
      <div 
        className="relative aspect-square sm:aspect-4/5 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner cursor-zoom-in group"
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={images[activeIndex]}
          alt={productName}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
          priority
        />
        {hasDiscount && discountPercent && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-red-500 text-white font-bold px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-1 z-10">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            Giảm {discountPercent}%
          </div>
        )}
        
        {/* Subtle hover icon overlay for indicating it's zoomable */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
          <div className="p-3 rounded-full bg-white/90 shadow-lg text-slate-800 backdrop-blur-xs scale-90 group-hover:scale-100 transition-all duration-300">
            <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 hide-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-none w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? "border-blue-600 shadow-md ring-2 ring-blue-100 opacity-100"
                  : "border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300"
              }`}
              aria-label={`Xem ảnh ${idx + 1}`}
            >
              <Image src={img} alt={`${productName} - ảnh ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Premium Preview Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-120 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 z-120 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() => setIsModalOpen(false)}
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main Modal Image Area */}
          <div 
            className="relative w-full max-w-5xl h-[65vh] sm:h-[75vh] px-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {/* Left Navigation */}
            {images.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-4 sm:left-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image Wrapper */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[activeIndex]}
                alt={productName}
                fill
                className="object-contain max-h-full max-w-full select-none"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
            </div>

            {/* Right Navigation */}
            {images.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 sm:right-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Counter & Thumbnails inside modal */}
          <div 
            className="mt-6 flex flex-col items-center gap-3 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
              {activeIndex + 1} / {images.length}
            </span>
            
            {images.length > 1 && (
              <div className="flex gap-2 max-w-full overflow-x-auto px-4 py-2 hide-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                      idx === activeIndex
                        ? "border-blue-500 scale-105 shadow-lg shadow-blue-500/30"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
