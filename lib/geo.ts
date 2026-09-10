import geo from "@/data/geo.json";
type G = { lat: number; lng: number; display: string } | null;
const map = geo as Record<string, G>;
export const geoFor = (city: string): G => map[city.trim().toLowerCase()] ?? null;
