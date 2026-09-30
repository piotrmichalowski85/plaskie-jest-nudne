import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.plaskiejestnudne.pl" }], destination: "https://plaskiejestnudne.pl/:path*", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "plaskie-jest-nudne.vercel.app" }], destination: "https://plaskiejestnudne.pl/:path*", permanent: true },
    ];
  },
  /* config options here */
};

export default nextConfig;
