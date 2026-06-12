"use client";

import { Menu, ShoppingCart, Search, X, Heart, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import SearchInput from "@/components/form/SearchInput";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/danh-muc", label: "Danh mục" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/thu-vien", label: "Thư viện" },
];

// Tách riêng component dùng useSearchParams để tránh lỗi Suspense boundary
function SearchBar({ className }: { className?: string }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    const timer = window.setTimeout(() => setSearch(currentSearch), 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  // Real-time search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (search !== currentSearch) {
        if (search.trim()) {
          router.push(`/san-pham?search=${encodeURIComponent(search.trim())}`);
        } else if (search === "" && currentSearch !== "") {
          router.push(`/san-pham`);
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, router, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative">
        <SearchInput
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leadingIcon={<Search className="w-4 h-4" />}
          className="rounded-full py-2 bg-slate-50"
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); router.push("/san-pham"); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}

export function Header() {
  const { items, toggleCart } = useCartStore();
  const { items: favoriteItems } = useFavoriteStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: sessionData } = useSession();
  const sessionUser = (sessionData?.user as any) ?? null;
  const { user: currentUser, isCollaborator } = useCurrentUser();


  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const hasAccount = Boolean(sessionUser);
  const accountAvatar = (sessionUser?.image as string | undefined) ?? "";

  // Đóng menu khi resize lên desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Khoá scroll khi menu mở
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalFavorites = favoriteItems.length;


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              className="md:hidden tap-target -ml-2 text-slate-600 hover:text-slate-900 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2 min-w-0 shrink">
              <Image src="/logo.png" alt="Tủ Nhựa Giá Rẻ" width={160} height={50} className="h-10 w-auto object-contain" />
            </Link>
          </div>

          {/* Thanh tìm kiếm ở Header */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <Suspense fallback={<div className="w-full h-9 bg-slate-100 rounded-full animate-pulse" />}>
              <SearchBar className="w-full" />
            </Suspense>
          </div>

          <nav className="hidden md:flex gap-4 lg:gap-6 items-center">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-blue-600 whitespace-nowrap">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <Link
              href="/yeu-thich"
              className="tap-target text-slate-600 hover:text-blue-600 relative cursor-pointer transition-colors flex items-center justify-center"
              aria-label="Sản phẩm yêu thích"
            >
              <Heart className="w-6 h-6" />
              {mounted && totalFavorites > 0 && (
                <span className="absolute top-0 right-0 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm transform translate-x-1/3 -translate-y-1/4 animate-pulse">
                  {totalFavorites}
                </span>
              )}
            </Link>

            <button
              onClick={() => toggleCart(true)}
              className="tap-target text-slate-600 hover:text-blue-600 relative cursor-pointer transition-colors flex items-center justify-center"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="w-6 h-6" />
              {mounted && totalItems > 0 && (
                <span className="absolute top-0 right-0 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm transform translate-x-1/3 -translate-y-1/4">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {!currentUser && (
              <Link
                href="/dang-nhap"
                className="hidden sm:inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Đăng nhập
              </Link>
            )}
            {!currentUser && (
              <Link
                href="/dang-ky-ctv"
                className="hidden sm:inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Đăng ký CTV
              </Link>
            )}
            {currentUser && isCollaborator && (
              <Link
                href="/cong-tac-vien"
                className="hidden sm:inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Khu vực CTV
              </Link>
            )}

            <Link
              href="/admin?tab=account"
              className="tap-target text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-center"
              aria-label="Tài khoản"
            >
              {mounted && hasAccount && accountAvatar ? (
                <Image
                  src={accountAvatar}
                  alt="Avatar"
                  width={32}
                  height={32}
                  unoptimized
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              ) : mounted && hasAccount ? (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
            </Link>
          </div>

        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-70 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <Image src="/logo.png" alt="Tủ Nhựa Giá Rẻ" width={140} height={44} className="h-9 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search trong mobile menu */}
        <div className="p-4 border-b border-slate-100">
          <Suspense fallback={<div className="w-full h-9 bg-slate-100 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin?tab=account"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
          >
            <UserIcon className="w-5 h-5" /> Tài khoản
          </Link>
          {!currentUser && (
            <Link
              href="/dang-nhap"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 font-medium transition-colors"
            >
              Đăng nhập
            </Link>
          )}
          {!currentUser && (
            <Link
              href="/dang-ky-ctv"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 font-medium transition-colors"
            >
              Đăng ký CTV
            </Link>
          )}
          {currentUser && isCollaborator && (
            <Link
              href="/cong-tac-vien"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 font-medium transition-colors"
            >
              Khu vực CTV
            </Link>
          )}
        </nav>

        {/* Footer của drawer */}
        <div className="p-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">© {new Date().getFullYear()} Tủ Nhựa Giá Rẻ</p>
        </div>
      </div>
    </>
  );
}
