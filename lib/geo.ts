import geo from "@/data/geo.json";
type G = { lat: number; lng: number; display: string; woj?: string } | null;
const map = geo as Record<string, G>;
export const geoFor = (city: string): G => map[city.trim().toLowerCase()] ?? null;
export const wojFor = (city: string): string | undefined => geoFor(city)?.woj;
export const wojLabel = (w: string) => `woj. ${w}`;
