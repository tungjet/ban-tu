"use client";

import { useState, Suspense, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, Filter, X, Star, SlidersHorizontal, Home, Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductActions } from "@/components/ProductActions";
import { supabase } from "@/lib/supabase";
import { CardFavoriteButton } from "@/components/CardFavoriteButton";
import { formatProductPrice, getNumericPrice } from "@/lib/price";

const PRICE_RANGES = [
  { id: "all", label: "Tất cả mức giá", min: 0, max: Infinity },
  { id: "under2m", label: "Dưới 2.000.000đ", min: 0, max: 2_000_000 },
  { id: "2m-5m", label: "Từ 2Tr - 5Tr", min: 2_000_000, max: 5_000_000 },
  { id: "over5m", label: "Trên 5.000.000đ", min: 5_000_000, max: Infinity },
];

function ProductListingContent() {
  const searchParams = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeSort, setActiveSort] = useState(searchParams.get('sort') || "phobien");
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || "all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [products, setProducts] = useState<{ id: string; name: string; price: string | number | null; image_url?: string; slug?: string; original_price?: string | number | null; created_at: string; category_id?: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Sync search and category from URL
  useEffect(() => {
    const search = searchParams.get('search') || "";
    const category = searchParams.get('category') || "all";
    const timer = window.setTimeout(() => {
      setSearchTerm(search);
      setSelectedCategory(category);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('*').eq('is_published', true),
        supabase.from('categories').select('id, name, slug'),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
    };
    fetchData();
  }, []);

  // Apply Filtering
  const activeCatObj = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
  const activeCatId = activeCatObj?.id || (selectedCategory === "all" ? "all" : null);

  const priceRange = PRICE_RANGES.find(r => r.id === selectedPrice) || PRICE_RANGES[0];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCatId === "all" || p.category_id === activeCatId;
    const price = getNumericPrice(p.price);
    const matchesPrice = selectedPrice === "all" || (price !== null && price >= priceRange.min && price < priceRange.max);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Apply Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (activeSort) {
      case "moinhat":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "giathapcao":
        return (getNumericPrice(a.price) ?? Infinity) - (getNumericPrice(b.price) ?? Infinity);
      case "giacaothap":
        return (getNumericPrice(b.price) ?? -Infinity) - (getNumericPrice(a.price) ?? -Infinity);
      default:
        return 0;
    }
  });

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedPrice("all");
    setSearchTerm("");
  };

  const allCategories = [{ id: "all", name: "Tất cả sản phẩm", slug: "all" }, ...categories];

  const renderFilterContent = () => (
    <>
      {/* Search Input */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">Tìm kiếm</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Group: Category */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">Danh mục</h3>
        <div className="space-y-2">
          {allCategories.map(cat => {
            const isSelected = cat.id === activeCatId;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug || cat.id)}
                className="w-full flex items-center gap-3 cursor-pointer group text-left"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-500'}`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm transition-colors ${isSelected ? 'text-blue-600 font-medium' : 'text-slate-600 group-hover:text-blue-600'}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Group: Price */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">Khoảng giá</h3>
        <div className="space-y-2">
          {PRICE_RANGES.map(range => (
            <button
              key={range.id}
              onClick={() => setSelectedPrice(range.id)}
              className="w-full flex items-center gap-3 cursor-pointer group text-left"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${selectedPrice === range.id ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-500'}`}>
                {selectedPrice === range.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
              </div>
              <span className={`text-sm transition-colors ${selectedPrice === range.id ? 'text-blue-600 font-medium' : 'text-slate-600 group-hover:text-blue-600'}`}>
                {range.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

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
            <span className="text-slate-900 font-medium">Tất cả sản phẩm</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col md:flex-row gap-5 lg:gap-8">

          {/* --- SIDEBAR FILTER (Desktop) --- */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 sticky top-24">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                  <Filter className="w-5 h-5" /> Bộ Lọc
                </div>
                {(selectedCategory !== "all" || selectedPrice !== "all" || searchTerm) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Xoá lọc
                  </button>
                )}
              </div>

              {renderFilterContent()}

              <button
                onClick={() => {/* filters applied reactively */}}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {sortedProducts.length} kết quả
              </button>
            </div>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <div className="flex-1 min-w-0">
            {/* Toolbar: Sort & Filter Button (Mobile) */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm border border-slate-100 flex flex-col gap-3">

              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="md:hidden flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" /> Lọc sản phẩm
                {(selectedCategory !== "all" || selectedPrice !== "all") && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[selectedCategory !== "all", selectedPrice !== "all"].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Sort Options */}
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <span className="text-sm text-slate-500 shrink-0 hidden sm:block">Sắp xếp:</span>
                {[
                  { id: "phobien", label: "Phổ biến" },
                  { id: "moinhat", label: "Mới nhất" },
                  { id: "giathapcao", label: "Giá tăng" },
                  { id: "giacaothap", label: "Giá giảm" },
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setActiveSort(sort.id)}
                    className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-colors border cursor-pointer ${
                      activeSort === sort.id
                        ? "bg-blue-55 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result count */}
            <div className="text-sm text-slate-500 mb-4">
              Hiển thị <span className="font-semibold text-slate-800">{sortedProducts.length}</span> sản phẩm
              {searchTerm && <> cho <span className="font-semibold text-blue-600">&ldquo;{searchTerm}&rdquo;</span></>}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {sortedProducts.map(product => {
                const price = getNumericPrice(product.price);
                const originalPrice = Number(product.original_price) || 0;
                const hasDiscount = price !== null && originalPrice > price;
                const discountPercent = hasDiscount ? Math.round((1 - price! / originalPrice) * 100) : 0;

                return (
                  <div key={product.id} className="group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex min-w-0 flex-col">
                    <Link href={`/san-pham/${product.slug || product.id}`} className="block relative aspect-4/5 bg-slate-100 overflow-hidden">
                      <Image src={product.image_url || "/placeholder.png"} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      {hasDiscount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{discountPercent}%
                        </div>
                      )}
                      <CardFavoriteButton
                        product={{
                          id: product.id,
                          name: product.name,
                          price: price ?? 0,
                          oldPrice: hasDiscount ? originalPrice : null,
                          image: product.image_url || "/placeholder.png",
                          slug: product.slug,
                        }}
                      />
                    </Link>
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" />
                        <span className="text-slate-400 text-[10px] sm:text-xs ml-1">(0)</span>
                      </div>
                      <Link href={`/san-pham/${product.slug || product.id}`} className="font-medium text-slate-900 text-xs sm:text-sm mb-1 line-clamp-2 hover:text-blue-600 cursor-pointer">
                        {product.name}
                      </Link>

                      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <div className="min-w-0">
                          <span className="text-red-600 font-bold block text-sm sm:text-base leading-tight">{formatProductPrice(product.price)}</span>
                          {hasDiscount && (
                            <span className="text-slate-400 text-[10px] sm:text-xs line-through block">{originalPrice.toLocaleString('vi-VN')}đ</span>
                          )}
                        </div>
                        <ProductActions product={{ id: product.id, name: product.name, price, image: product.image_url || "/placeholder.png" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-slate-500">Không tìm thấy sản phẩm</p>
                <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
                <button onClick={resetFilters} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors">
                  Xoá bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MOBILE FILTER DRAWER --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setIsFilterOpen(false)} />
      )}

      <div className={`fixed bottom-0 left-0 w-full bg-white z-50 rounded-t-3xl transition-transform duration-300 ease-out md:hidden flex flex-col ${isFilterOpen ? "translate-y-0" : "translate-y-full"}`} style={{ maxHeight: "90dvh", height: "auto" }}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-5 h-5" /> Lọc Sản Phẩm
          </h2>
          <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-red-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {renderFilterContent()}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3 pb-safe shrink-0" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button
            onClick={resetFilters}
            className="flex-1 py-3.5 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-50"
          >
            Xoá lọc
          </button>
          <button
            onClick={() => setIsFilterOpen(false)}
            className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 cursor-pointer hover:bg-blue-700 px-4"
          >
            {sortedProducts.length} kết quả
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Đang tải dữ liệu...</div>}>
      <ProductListingContent />
    </Suspense>
  );
}
