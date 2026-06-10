import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Layers } from "lucide-react";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";

export const metadata: Metadata = {
  title: "Danh mục sản phẩm | Tủ Nhựa Giá Rẻ",
  description: "Khám phá các danh mục sản phẩm nội thất cao cấp từ Tủ Nhựa Giá Rẻ bao gồm tủ quần áo, giường ngủ, tủ bếp.",
  openGraph: {
    title: "Danh mục sản phẩm | Tủ Nhựa Giá Rẻ",
    description: "Khám phá các danh mục sản phẩm nội thất cao cấp từ Tủ Nhựa Giá Rẻ bao gồm tủ quần áo, giường ngủ, tủ bếp.",
    url: "https://noithatgiare.shop/danh-muc",
  }
};

export default async function CategoryPage() {
  await connectDB();
  const categoryDocs = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();
  const categories = categoryDocs.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    image_url: c.imageUrl ?? null,
    description: c.description ?? "",
    display_order: c.displayOrder ?? 0,
  }));

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">Danh mục Sản phẩm</h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-lg">Khám phá các bộ sưu tập nội thất tuyệt đẹp từ Tủ Nhựa Giá Rẻ, được thiết kế để nâng tầm không gian sống của bạn.</p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {categories.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Chưa có danh mục nào</p>
            <p className="text-sm mt-1">Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category, index) => {
              // Đa dạng hoá kích thước thẻ: thẻ đầu tiên rộng gấp đôi nếu chia đều cho 3
              const colSpan = index === 0 && categories.length >= 3 ? "md:col-span-2" : "md:col-span-1";
              return (
                <Link
                  key={category.id}
                  href={`/san-pham?category=${category.slug || category.id}`}
                  className={`group relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${colSpan}`}
                >
                  {/* Image */}
                  <Image
                    src={category.image_url || "/cat-tu.png"}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent transition-opacity group-hover:opacity-90" />

                  {/* Content */}
                  <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-end">
                    <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                      <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 leading-tight">{category.name}</h2>
                      {category.description && (
                        <p className="text-slate-300 text-sm sm:text-base line-clamp-2">{category.description}</p>
                      )}
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 transform translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
