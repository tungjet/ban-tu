import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import { Gallery, type GalleryItem } from "@/components/Gallery";
import { Image as ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Thư viện nội thất | Tủ Nhựa Giá Rẻ",
  description: "Xem và khám phá các mẫu nội thất đẹp mắt. Bấm vào ảnh để xem chi tiết sản phẩm và đặt mua ngay.",
};

export const revalidate = 0;

export default async function GalleryPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, price, original_price, image_url, images, description")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  type ProductForGallery = {
    id: string;
    name: string;
    slug?: string | null;
    price: number | string | null;
    original_price?: number | string | null;
    image_url?: string | null;
    images?: string[] | null;
    description?: string | null;
  };

  const galleryItems: GalleryItem[] = [];
  for (const p of (data || []) as ProductForGallery[]) {
    const productImages =
      p.images && p.images.length > 0
        ? p.images
        : p.image_url
        ? [p.image_url]
        : [];
    productImages.forEach((img, idx) => {
      galleryItems.push({
        id: `${p.id}-${idx}`,
        image_url: img,
        title: p.name,
        description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 140),
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug ?? null,
          price: p.price ?? null,
          original_price: p.original_price ? Number(p.original_price) : null,
          image_url: p.image_url ?? null,
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
