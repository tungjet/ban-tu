import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/thanh-toan"],
      },
    ],
    sitemap: "https://noithatgiare.shop/sitemap.xml",
  };
}
