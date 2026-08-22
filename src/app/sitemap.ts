import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://rankrival.lol";
  return ["", "/about", "/rules", "/stats"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" || path === "/stats" ? "hourly" as const : "monthly" as const, priority: path === "" ? 1 : .7 }));
}
