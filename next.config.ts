import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.plaskiejestnudne.pl" }], destination: "https://plaskiejestnudne.pl/:path*", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "plaskie-jest-nudne.vercel.app" }], destination: "https://plaskiejestnudne.pl/:path*", permanent: true },
    ];
  },
  async rewrites() {
    // feedy iCal per hub pod adresem huba: /biegi/pasmo/beskidy.ics -> /ics-hub/pasmo/beskidy
    return [{ source: "/biegi/:hub+.ics", destination: "/ics-hub/:hub+" }];
  },
};

export default nextConfig;
