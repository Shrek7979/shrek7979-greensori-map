import type { MetadataRoute } from "next";
import { cafes } from "@/data/cafes";

const BASE = "https://greensori-map.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...cafes.map((cafe) => ({
      url: `${BASE}/cafe/${cafe.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...((cafe.updatedAt ?? cafe.addedAt)
        ? { lastModified: new Date(`${cafe.updatedAt ?? cafe.addedAt}T00:00:00+09:00`) }
        : {}),
    })),
  ];
}
