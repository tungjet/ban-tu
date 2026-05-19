"use client";

import { useState, useRef, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (contentRef.current) {
        // 150px matches roughly 6 lines of text-sm with leading-relaxed
        const hasOverflow = contentRef.current.scrollHeight > 150;
        setShouldShowButton(hasOverflow);
      }
    };

    // Run initially
    checkTruncation();

    // Re-check on window resize to keep it responsive
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [description]);

  return (
    <div className="mb-4 sm:mb-6">
      <div className="relative">
        <div
          ref={contentRef}
          style={{
            maxHeight: isExpanded ? "none" : "150px",
          }}
          className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none transition-all duration-300 ease-in-out overflow-hidden"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
        />

        {!isExpanded && shouldShowButton && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {shouldShowButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-600 hover:text-blue-700 font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
        >
          {isExpanded ? (
            <>
              Thu gọn <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Xem thêm <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
