import dataset from "@/data/races.json";
import type { Dataset, Race } from "./types";

const ds = dataset as Dataset;
export const generatedAt = ds.generatedAt;
export const allRaces: Race[] = ds.races;
export const today = () => new Date().toISOString().slice(0, 10);
export const upcomingRaces = () => allRaces.filter((r) => r.dateEnd >= today());
export const raceById = (id: string) => allRaces.find((r) => r.id === id);
export const regions = () => [...new Set(allRaces.map((r) => r.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
