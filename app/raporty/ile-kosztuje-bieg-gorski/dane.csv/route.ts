/** Zbiór raportu cen jako CSV: jeden wiersz na cennik (bieg i dystans), te same rekordy co data/raport_ceny.json. */
import { report, toCsv } from "@/lib/raport-ceny";

export const dynamic = "force-static";

export function GET() {
  const note = `# ${report.title}. Źródło: plaskiejestnudne.pl/raporty/ile-kosztuje-bieg-gorski, licencja CC BY 4.0. Zbiór z ${report.generatedAt}, regulaminy odczytane od ${report.readFrom} do ${report.readTo}. Kwoty brutto w zł.`;
  return new Response(`${note}\n${toCsv()}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="ceny-biegow-gorskich-2026-2027-plaskiejestnudne.csv"', "cache-control": "public, max-age=3600" } });
}
