import type { MetadataRoute } from "next";
import { allRaces } from "@/lib/data";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://plaskiejestnudne.pl";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/biegi`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/kreator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/slownik`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/o-serwisie`, changeFrequency: "yearly", priority: 0.3 },
    ...allRaces.map((r) => ({ url: `${base}/bieg/${r.id}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
