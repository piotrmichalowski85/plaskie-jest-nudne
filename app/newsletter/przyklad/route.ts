/** Przykładowe wydanie newslettera zbudowane z aktualnych danych (ten sam generator co szkic kampanii). Statyczne, poza indeksem. */
import { buildIssue } from "@/lib/newsletter";
import { today } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  const issue = buildIssue(today());
  const html = issue.html.replace("{{ unsubscribe }}", "https://plaskiejestnudne.pl/newsletter");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } });
}
