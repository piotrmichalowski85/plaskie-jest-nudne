import { pastLite } from "@/lib/lite";
import { mojeLite } from "@/lib/moje-data";
export const dynamic = "force-static";
export const dynamicParams = false;
/** lekkie pliki JSON z hashem treści w nazwie: minione biegi dla /biegi i komplet biegów dla /moje */
const files = () => [pastLite(), mojeLite()];
export function generateStaticParams() { return files().map((f) => ({ file: f.name })); }
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const f = files().find((x) => x.name === file);
  if (!f) return new Response("not found", { status: 404 });
  return new Response(f.body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=31536000, immutable" } });
}
