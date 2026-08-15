import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const apiBase =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "http://161.118.198.102:3001/api"
    : "http://localhost:4001/api");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig)
