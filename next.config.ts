import type { NextConfig } from "next";
import slugRedirects from "./data/redirects.json";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.plaskiejestnudne.pl" }], destination: "https://plaskiejestnudne.pl/:path*", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "plaskie-jest-nudne.vercel.app" }], destination: "https://plaskiejestnudne.pl/:path*", permanent: true },
      // adresy biegów, które zniknęły po scaleniu powielonych rekordów albo zmianie nazwy w źródle (data/redirects.json: stary id -> nowy id)
      ...Object.entries(slugRedirects as Record<string, string>).map(([from, to]) => ({ source: `/bieg/${from}`, destination: `/bieg/${to}`, permanent: true })),
    ];
  },
  async rewrites() {
    // feedy iCal per hub pod adresem huba: /biegi/pasmo/beskidy.ics -> /ics-hub/pasmo/beskidy
    return [{ source: "/biegi/:hub+.ics", destination: "/ics-hub/:hub+" }];
  },
};

export default nextConfig;
