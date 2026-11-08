import type { NextRequest } from "next/server";
import { embedHtml } from "@/lib/embed";
/** /embed?pasmo=beskidy&limit=5: widget do <iframe>; odpowiedź cache'owana na CDN per zestaw parametrów */
export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return new Response(embedHtml(req.nextUrl.searchParams), { headers: {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400",
    "x-robots-tag": "noindex",
  } });
}
