# plaskiejestnudne.pl

Kalendarz biegów górskich, trailowych i przełajowych w Polsce + kreator pierwszego niepłaskiego biegu. Niekomercyjny.

- `scripts/scrape.ts` pobiera fakty (nazwa, data, miejsce, dystanse, D+) z kalendarzy, normalizuje, deduplikuje i zapisuje `data/races.json`.
- `lib/normalize.ts` daty PL, dystanse, pasma, ocena "dobry na start" (1-5).
- Strona: Next.js (App Router), dane statyczne z JSON, odświeżane co tydzień przez GitHub Actions (`.github/workflows/refresh.yml`).

```bash
npm i && npx tsx scripts/scrape.ts && npm run dev
```
Plan i research: `docs/PLAN.md`.
