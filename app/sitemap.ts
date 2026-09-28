import type { MetadataRoute } from "next";
import { SECTORES } from "@/data/sectors";
import { SITE_URL } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/demo", "/servicios", "/privacidad", ...SECTORES.map((s) => `/sectores/${s.id}`)];
  return pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 }));
}
