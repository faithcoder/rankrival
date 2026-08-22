import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://rankrival.lol";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/success"] }, sitemap: `${base}/sitemap.xml`, host: base };
}
