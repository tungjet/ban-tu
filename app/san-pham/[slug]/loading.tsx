import { Home } from "lucide-react";

export default function ProductDetailLoading() {
  return (
    <main className="w-full bg-slate-50 min-h-screen py-4 sm:py-8">
      {/* Breadcrumb skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <nav className="flex items-center text-xs sm:text-sm text-slate-500 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <div className="flex items-center gap-1 shrink-0">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
            <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
          <span className="mx-1.5 sm:mx-2">/</span>
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse shrink-0" />
          <span className="mx-1.5 sm:mx-2">/</span>
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse shrink-0" />
        </nav>
      </div>

      {/* Main product card skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          
          {/* Left Column: Gallery Skeleton */}
          <div className="space-y-4">
            <div className="aspect-square sm:aspect-4/5 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-20 bg-slate-200 rounded-xl shrink-0 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Right Column: Details Skeleton */}
          <div className="flex flex-col">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-3/4 mb-3" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-28 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
            </div>

            {/* Price Box Skeleton */}
            <div className="p-4 sm:p-5 bg-linear-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-2xl mb-6 space-y-2">
              <div className="h-8 w-44 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </div>

            {/* Mock Description lines */}
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-slate-150 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-150 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-slate-150 rounded animate-pulse w-4/5" />
            </div>

            {/* Features Skeleton */}
            <div className="mb-6 space-y-3">
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="space-y-2 pl-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-200 animate-pulse shrink-0" />
                    <div className="h-4 bg-slate-150 rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
            </div>
            <div className="h-12 bg-slate-200 rounded-xl animate-pulse w-full mt-3" />
          </div>

        </div>
      </div>

      {/* Reviews & Comments Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 mb-12 sm:mb-16">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 shadow-sm border border-slate-100">
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Reviews Skeleton */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-2 animate-pulse">
                  <div className="h-7 w-12 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
                <div className="flex-1 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-slate-200 rounded animate-pulse" />
                      <div className="h-2 bg-slate-100 rounded animate-pulse flex-1" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-6 space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                      <div className="space-y-1 flex-1">
                        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-4 bg-slate-150 rounded animate-pulse w-full" />
                    <div className="h-4 bg-slate-150 rounded animate-pulse w-2/3" />
                  </div>
                ))}
              </div>
            </div>

            {/* Q&A / Ask Form Skeleton */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="h-10 w-28 bg-slate-200 rounded-xl animate-pulse ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
