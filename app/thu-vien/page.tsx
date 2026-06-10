import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Gallery, type GalleryItem } from "@/components/Gallery";
import { Image as ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Thư viện nội thất | Tủ Nhựa Giá Rẻ",
  description: "Xem và khám phá các mẫu nội thất đẹp mắt. Bấm vào ảnh để xem chi tiết sản phẩm và đặt mua ngay.",
};

export const revalidate = 0;

export default async function GalleryPage() {
  await connectDB();
  const productDocs = await Product.find({ isPublished: true })
    .select("name slug price originalPrice imageUrl images description")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const galleryItems: GalleryItem[] = [];
  for (const p of productDocs) {
    const productImages =
      p.images && p.images.length > 0
        ? p.images
        : p.imageUrl
        ? [p.imageUrl]
        : [];
    const productId = p._id.toString();
    productImages.forEach((img: string, idx: number) => {
      galleryItems.push({
        id: `${productId}-${idx}`,
        image_url: img,
        title: p.name,
        description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 140),
        product: {
          id: productId,
          name: p.name,
          slug: p.slug ?? null,
          price: p.price ?? null,
          original_price: p.originalPrice ? Number(p.originalPrice) : null,
          image_url: p.imageUrl ?? null,
        },
      });
    });
  }

  return (
    <main className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <ImageIcon className="w-4 h-4" />
            Thư viện mẫu
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Thư viện nội thất
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Khám phá các mẫu thiết kế nội thất đẹp mắt. Bấm vào ảnh để xem chi tiết sản phẩm và đặt mua ngay.
          </p>
        </div>

        {/* Gallery Grid */}
        {galleryItems.length > 0 ? (
          <Gallery items={galleryItems} />
        ) : (
          <div className="text-center py-20 text-slate-500 bg-white rounded-3xl shadow-sm border border-slate-100">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Chưa có ảnh nào</p>
            <p className="text-sm mt-1">Sản phẩm sẽ được cập nhật sớm!</p>
          </div>
        )}
      </div>
    </main>
  );
}
