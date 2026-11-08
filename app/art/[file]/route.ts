import { ART_KINDS, artSvg, type ArtKind } from "@/components/RegionArt";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return ART_KINDS.map((k) => ({ file: `${k}.svg` })); }
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const k = (await params).file.replace(/\.svg$/, "") as ArtKind;
  return new Response(artSvg(k), { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } });
}
