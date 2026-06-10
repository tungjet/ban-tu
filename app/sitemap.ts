import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";

const BASE_URL = "https://noithatgiare.shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const productDocs = await Product.find({ isPublished: true })
    .select("slug updatedAt")
    .lean();
  const categoryDocs = await Category.find().select("_id updatedAt").lean();

  const productUrls: MetadataRoute.Sitemap = productDocs.map((p) => ({
    url: `${BASE_URL}/san-pham/${p.slug || p._id.toString()}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categoryDocs.map((c) => ({
    url: `${BASE_URL}/san-pham?category=${c._id.toString()}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
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
