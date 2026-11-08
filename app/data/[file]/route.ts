import { pastLite } from "@/lib/lite";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return [{ file: pastLite().name }]; }
export function GET() {
  return new Response(pastLite().body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=31536000, immutable" } });
}
