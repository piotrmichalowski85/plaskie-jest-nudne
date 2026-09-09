export type Surface = "gorski" | "trail" | "przelaj" | "miejski";

export type Race = {
  id: string; // stable slug
  name: string;
  eventName: string; // festiwal / impreza (moze byc = name)
  dateStart: string; // YYYY-MM-DD
  dateEnd: string; // YYYY-MM-DD
  city: string;
  region: string; // pasmo / region (np. Beskid Niski)
  voivodeship?: string;
  distancesKm: number[]; // wszystkie dystanse imprezy
  minKm: number;
  maxKm: number;
  elevations: { km: number; dplus?: number; approx?: boolean; limitH?: number }[]; // approx = D+ zebrane ze strony organizatora, przypisane do najdłuższego dystansu
  vertical: boolean;
  category?: string; // np. Kat.I (liga biegigorskie)
  surface: Surface;
  url?: string; // strona organizatora / zapisy
  sources: { name: string; url: string }[];
  beginnerScore: number; // 1-5, 5 = idealny pierwszy
  beginnerWhy: string;
  regulaminUrl?: string; // regulamin zawodów (pdf/html), znaleziony automatycznie
  gear?: string[]; // sprzęt obowiązkowy wyciągnięty z regulaminu (heurystyka)
  signupOpen?: boolean;
  participants?: number;
};

export type Dataset = { generatedAt: string; count: number; races: Race[] };
