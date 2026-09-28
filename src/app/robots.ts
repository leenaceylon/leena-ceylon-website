import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/cart",
          "/checkout",
          "/account/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/cart",
          "/checkout",
          "/account/",
        ],
      },
    ],
    sitemap: "https://leenaceylon.com/sitemap.xml",
    host: "https://leenaceylon.com",
  };
}

