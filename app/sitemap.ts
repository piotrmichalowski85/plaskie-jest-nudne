import type { MetadataRoute } from "next";
import { allRaces, generatedAt, today } from "@/lib/data";
import { allHubs, hubPath } from "@/lib/hubs";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://plaskiejestnudne.pl";
  return [
    { url: base, lastModified: generatedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/biegi`, lastModified: generatedAt, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/kreator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/czy-dam-rade`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/slownik`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/o-serwisie`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/prywatnosc`, changeFrequency: "yearly", priority: 0.1 },
    ...allHubs().map((h) => ({ url: `${base}${hubPath(h)}`, lastModified: generatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...allRaces.map((r) => r.dateEnd >= today()
      ? { url: `${base}/bieg/${r.id}`, lastModified: generatedAt, changeFrequency: "weekly" as const, priority: 0.7 }
      : { url: `${base}/bieg/${r.id}`, lastModified: `${r.dateEnd}T12:00:00.000Z`, changeFrequency: "yearly" as const, priority: 0.3 }),
  ];
}
