export default function ProductsLoading() {
  return (
    <main className="w-full bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-slate-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar skeleton */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
                ))}
              </div>
              <div className="h-px bg-slate-100" />
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
                ))}
              </div>
            </div>
          </aside>

          {/* Product grid skeleton */}
          <div className="flex-1">
            {/* Toolbar skeleton */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-slate-100 flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 w-24 bg-slate-100 rounded-full animate-pulse" />
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="aspect-4/5 bg-slate-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
