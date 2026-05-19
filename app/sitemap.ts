import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://noithatgiare.shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Lấy tất cả sản phẩm
  const { data: products } = await supabase
    .from("products")
    .select("slug, id, updated_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Lấy tất cả danh mục
  const { data: categories } = await supabase
    .from("categories")
    .select("id, updated_at");

  const productUrls: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${BASE_URL}/san-pham/${p.slug || p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((c) => ({
    url: `${BASE_URL}/san-pham?category=${c.id}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/san-pham`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/danh-muc`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/thu-vien`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
