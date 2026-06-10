import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: import.meta.dirname,
  },
  // In development, proxy /api/* to the NestJS backend (localhost:8000).
  // In production, the ALB routes /api/* to the backend before it reaches Next.js,
  // so these rewrites never fire in prod.
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
