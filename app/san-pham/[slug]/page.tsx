import { Star, Check, Home, User, ThumbsUp } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PDPProductActions } from "@/components/PDPProductActions";
import { PDPImageGallery } from "@/components/PDPImageGallery";
import { ProductActions } from "@/components/ProductActions";
import Link from "next/link";
import Image from "next/image";
import CommentForm from "@/components/CommentForm";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductDescription } from "@/components/ProductDescription";
import { ProductShareActions } from "@/components/ProductShareActions";
import { formatProductPrice, getNumericPrice } from "@/lib/price";
import { ZaloConsultButton } from "@/components/ZaloConsultButton";
import { ProductAdminEditButton } from "@/components/ProductAdminEditButton";


interface ProductRow {
  id: string;
  name: string;
  slug?: string | null;
  price: number | string | null;
  original_price?: number | string | null;
  description?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  features?: string[] | null;
  rating?: number | null;
  sold?: number | null;
  category_id?: number | string | null;
  created_at?: string;
}

interface CategoryRow {
  id: number | string;
  name: string;
  slug?: string | null;
}

interface ReviewRow {
  id: string;
  user_name?: string | null;
  rating: number;
  variant_label?: string | null;
  content: string;
  created_at: string;
}

interface CommentRow {
  id: string;
  user_name?: string | null;
  content: string;
  reply?: string | null;
  created_at: string;
}

async function findProductBySlug(slug: string): Promise<ProductRow | null> {
  const { data: bySlug } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (bySlug) return bySlug as ProductRow;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (isUuid || !isNaN(Number(slug))) {
    const { data: byId } = await supabase
      .from("products")
      .select("*")
      .eq("id", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (byId) return byId as ProductRow;
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const productData = await findProductBySlug(slug);

  if (!productData) {
    return { title: "Không tìm thấy sản phẩm | Tủ Nhựa Giá Rẻ" };
  }

  const productName = productData.name;
  const description =
    productData.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
    `Mua ${productName} chính hãng tại Tủ Nhựa Giá Rẻ. Chất liệu Ecoplast siêu bền, chống nước tuyệt đối, bảo hành 10 năm.`;

  return {
    title: `${productName} | Tủ Nhựa Giá Rẻ`,
    description,
    alternates: {
      canonical: `https://noithatgiare.shop/san-pham/${slug}`,
    },
    openGraph: {
      title: `${productName} | Tủ Nhựa Giá Rẻ`,
      description,
      url: `https://noithatgiare.shop/san-pham/${slug}`,
      siteName: "Tủ Nhựa Giá Rẻ",
      images: productData.image_url
        ? [
            {
              url: productData.image_url,
              width: 800,
              height: 600,
              alt: productName,
            },
          ]
        : [],
      locale: "vi_VN",
      type: "article", // hoặc "website" tùy chọn, nhưng article tốt cho trang chi tiết
    },
    twitter: {
      card: "summary_large_image",
      title: `${productName} | Tủ Nhựa Giá Rẻ`,
      description,
      images: productData.image_url ? [productData.image_url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const productData = await findProductBySlug(slug);

  // Fix #6: Trả về 404 đúng nghĩa nếu không tìm thấy sản phẩm
  if (!productData) {
    notFound();
  }

  // Fetch dữ liệu phụ thuộc song song
  const [commentsRes, reviewsRes, categoryRes, similarRes] = await Promise.all([
    supabase
      .from("comments")
      .select("*")
      .eq("product_id", productData.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productData.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    productData.category_id
      ? supabase
          .from("categories")
          .select("id, name, slug")
          .eq("id", productData.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    productData.category_id
      ? supabase
          .from("products")
          .select("*")
          .eq("category_id", productData.category_id)
          .eq("is_published", true)
          .neq("id", productData.id)
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  const comments = (commentsRes.data || []) as CommentRow[];
  const reviews = (reviewsRes.data || []) as ReviewRow[];
  const category = (categoryRes.data || null) as CategoryRow | null;
  let similarProducts = (similarRes.data || []) as ProductRow[];

  // Bù thêm sản phẩm khác nếu chưa đủ 10
  if (similarProducts.length < 10) {
    const { data: extra } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .neq("id", productData.id)
      .limit(20);
    const existingIds = new Set(similarProducts.map((p) => p.id));
    const filtered = (extra || []).filter((p) => !existingIds.has(p.id));
    similarProducts = [...similarProducts, ...filtered].slice(0, 10);
  }

  // Tính toán thống kê review
  const reviewCount = reviews.length;
  const ratingFromReviews =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
      : Number(productData.rating ?? 5);
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating]++;
  });

  // Map dữ liệu sản phẩm
  const price = getNumericPrice(productData.price);
  const originalPrice = productData.original_price ? Number(productData.original_price) : 0;
  const hasDiscount = price !== null && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round((1 - price! / originalPrice) * 100) : 0;
  const productImages =
    productData.images && productData.images.length > 0
      ? productData.images
      : productData.image_url
      ? [productData.image_url]
      : ["/cat-tu.png"];
  const features = productData.features || [];
  const sold = productData.sold ?? 0;
  const productName = productData.name;
  const description = productData.description || "Sản phẩm nội thất cao cấp từ Tủ Nhựa Giá Rẻ.";

  // Fix #5: Tạo Zalo href đúng
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productName,
    "image": productImages,
    "description": productData.description?.replace(/<[^>]*>/g, "").slice(0, 200) || productName,
    "offers": {
      "@type": "Offer",
      "url": `https://noithatgiare.shop/san-pham/${slug}`,
      "priceCurrency": "VND",
      "price": price ?? 0,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock"
    },
    ...(reviewCount > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": ratingFromReviews.toFixed(1),
        "reviewCount": reviewCount
      }
    }),
    ...(reviews.length > 0 && {
      "review": reviews.slice(0, 5).map(rv => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": rv.rating,
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": rv.user_name || "Khách hàng ẩn danh"
        }
      }))
    })
  };

  return (
    <main className="w-full bg-slate-50 min-h-screen py-4 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <nav className="flex items-center text-xs sm:text-sm text-slate-500 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1 shrink-0">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Trang chủ
          </Link>
          <span className="mx-1.5 sm:mx-2">/</span>
          {category ? (
            <Link href={`/san-pham?category=${category.slug || category.id}`} className="hover:text-blue-600 shrink-0">
              {category.name}
            </Link>
          ) : (
            <Link href="/san-pham" className="hover:text-blue-600 shrink-0">
              Sản phẩm
            </Link>
          )}
          <span className="mx-1.5 sm:mx-2">/</span>
          <span className="text-slate-900 font-medium truncate max-w-[140px] sm:max-w-none">{productName}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">

          {/* Left Column: Images */}
          <PDPImageGallery
            images={productImages}
            productName={productName}
            hasDiscount={hasDiscount}
            discountPercent={discountPercent}
          />

          {/* Right Column: Info */}
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight sm:pr-2">
                {productName}
              </h1>
              <div className="flex items-center gap-2 shrink-0 self-start">
                <ProductAdminEditButton productId={productData.id} />
                <FavoriteButton
                  product={{
                    id: productData.id,
                    name: productName,
                    price: price ?? 0,
                    oldPrice: hasDiscount ? originalPrice : null,
                    image: productImages[0],
                    slug: slug,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-sm">
              <div className="flex items-center text-amber-400 bg-amber-50 px-2 py-1 rounded-md">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                <span className="font-bold text-amber-700 ml-1 text-xs sm:text-sm">{ratingFromReviews.toFixed(1)}</span>
                <span className="text-amber-600 ml-1 text-xs sm:text-sm">({reviewCount} đánh giá)</span>
              </div>
              <span className="text-slate-600 font-medium bg-slate-100 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                Đã bán {sold}
              </span>
            </div>

            <div className="mb-4 sm:mb-6">
              <ProductShareActions
                title={productName}
                description={productData.description?.replace(/<[^>]*>/g, "").slice(0, 120)}
              />
            </div>

            <div className="p-4 sm:p-5 bg-linear-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-2xl mb-4 sm:mb-6 shadow-sm">
              <div className="flex items-end gap-2 sm:gap-3 mb-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-blue-700">{formatProductPrice(productData.price)}</span>
                {hasDiscount && (
                  <span className="text-base sm:text-lg text-slate-400 line-through mb-0.5">
                    {originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs sm:text-sm text-green-600 flex items-center gap-1 font-medium bg-green-50 w-fit px-2 py-1 rounded-md">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tiết kiệm{" "}
                  {(originalPrice - price).toLocaleString("vi-VN")}đ
                </p>
              )}
            </div>

            {/* Mô tả sản phẩm */}
            <ProductDescription description={description} />

            {/* Đặc điểm nổi bật */}
            {features.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="font-bold text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">Đặc điểm nổi bật</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <PDPProductActions
              product={{
                id: productData.id,
                name: productName,
                price,
                oldPrice: hasDiscount ? originalPrice : null,
                image: productImages[0],
              }}
            />

            <ZaloConsultButton />
          </div>
        </div>
      </div>

      {/* Đánh giá & Bình luận */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 mb-12 sm:mb-16">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 shadow-sm border border-slate-100">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8 border-b border-slate-100 pb-4">
            Đánh giá & Hỏi đáp
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Reviews Section */}
            <div>
              <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">{ratingFromReviews.toFixed(1)}</span>
                  <div className="flex text-amber-400 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ${
                          i < Math.round(ratingFromReviews) ? "" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-500 text-xs sm:text-sm mt-1">{reviewCount} đánh giá</span>
                </div>
                <div className="flex-1 space-y-1.5 sm:space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct =
                      reviewCount > 0 ? (ratingDistribution[star] / reviewCount) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <span className="w-3">{star}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-current" />
                        <div className="flex-1 h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-5 sm:space-y-6">
                {reviews.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    Chưa có đánh giá nào cho sản phẩm này.
                  </p>
                )}
                {reviews.slice(0, 5).map((rv) => (
                  <div key={rv.id} className="pb-5 sm:pb-6 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">
                            {rv.user_name || "Khách hàng ẩn danh"}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 fill-current ${
                                    i < rv.rating ? "" : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            {rv.variant_label && (
                              <span className="text-slate-400 text-xs truncate">
                                {rv.variant_label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs shrink-0">
                        {new Date(rv.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm mt-2 sm:mt-3 leading-relaxed">{rv.content}</p>
                    <div className="mt-2 sm:mt-3 flex items-center gap-1 text-slate-400 hover:text-blue-600 text-sm cursor-pointer w-fit transition-colors">
                      <ThumbsUp className="w-4 h-4" /> Hữu ích
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Q&A Section */}
            <div>
              <CommentForm productId={productData.id} />

              <div className="space-y-5 sm:space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id}>
                    <div className="flex items-start gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                        {(comment.user_name || "N")[0].toUpperCase()}
                      </div>
                      <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 flex-1 min-w-0">
                        <p className="font-bold text-slate-900 mb-1">
                          {comment.user_name || "Người dùng giấu tên"}
                        </p>
                        {comment.content}
                      </div>
                    </div>
                    {(() => {
                      if (!comment.reply) return null;
                      let replies: Array<{ content: string; created_at: string }> = [];
                      try {
                        const parsed = JSON.parse(comment.reply);
                        replies = Array.isArray(parsed)
                          ? parsed
                          : [{ content: comment.reply, created_at: "" }];
                      } catch {
                        replies = [{ content: comment.reply, created_at: "" }];
                      }
                      return (
                        <div className="space-y-2 pl-10 sm:pl-11">
                          {replies.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 sm:gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
                                N
                              </div>
                              <div className="bg-green-50 border border-green-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 flex-1 min-w-0">
                                <p className="font-bold text-green-700 mb-1">Tủ Nhựa Giá Rẻ</p>
                                {r.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-slate-500 text-center">
                    Chưa có câu hỏi nào cho sản phẩm này.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-10 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Sản phẩm tương tự</h2>
            <div className="flex overflow-x-auto gap-3 sm:gap-6 hide-scrollbar snap-x pb-4">
              {similarProducts.map((sim) => {
                const simPrice = getNumericPrice(sim.price);
                const simOriginal = Number(sim.original_price) || simPrice;
                const simDiscount =
                  simPrice !== null && simOriginal && simOriginal > simPrice
                    ? Math.round((1 - simPrice / simOriginal) * 100)
                    : 0;

                return (
                  <div
                    key={sim.id}
                    className="w-[150px] sm:w-[220px] md:w-[260px] shrink-0 snap-start group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex min-w-0 flex-col"
                  >
                    <Link
                      href={`/san-pham/${sim.slug || sim.id}`}
                      className="block relative aspect-4/5 bg-slate-100 overflow-hidden"
                    >
                      <Image
                        src={sim.image_url || "/cat-tu.png"}
                        alt={sim.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {simDiscount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{simDiscount}%
                        </div>
                      )}
                    </Link>
                    <div className="p-2.5 sm:p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-slate-600 text-[10px] sm:text-xs ml-0.5 font-medium">
                          {Number(sim.rating ?? 5).toFixed(1)}
                        </span>
                        <span className="text-slate-400 text-[10px] sm:text-xs ml-0.5">
                          ({sim.sold ?? 0})
                        </span>
                      </div>
                      <Link
                        href={`/san-pham/${sim.slug || sim.id}`}
                        className="font-medium text-slate-900 text-xs sm:text-sm mb-1 line-clamp-2 hover:text-blue-600"
                      >
                        {sim.name}
                      </Link>

                      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <div className="min-w-0">
                          <span className="text-red-600 font-bold block text-xs sm:text-sm">
                            {formatProductPrice(sim.price)}
                          </span>
                          {simPrice !== null && simOriginal && simOriginal > simPrice && (
                            <span className="text-slate-400 text-[10px] sm:text-xs line-through block">
                              {simOriginal.toLocaleString("vi-VN")}đ
                            </span>
                          )}
                        </div>
                        <ProductActions
                          product={{
                            id: sim.id,
                            name: sim.name,
                            price: simPrice,
                            oldPrice: simPrice !== null && simOriginal && simOriginal > simPrice ? simOriginal : null,
                            image: sim.image_url || "/cat-tu.png",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>


    </main>
  );
}
