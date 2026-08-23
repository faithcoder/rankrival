import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://rankrival.lol";
  const pages: MetadataRoute.Sitemap = ["", "/about", "/rules", "/stats"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" || path === "/stats" ? "hourly" as const : "monthly" as const, priority: path === "" ? 1 : .7 }));
  const listings = getDb().prepare("SELECT id, updated_at FROM listings WHERE paid = 1").all() as { id: number; updated_at: string }[];
  return pages.concat(listings.map((listing) => ({
    url: `${base}/listing/${listing.id}`,
    lastModified: new Date(listing.updated_at),
    changeFrequency: "daily" as const,
    priority: .6,
  })));
}
