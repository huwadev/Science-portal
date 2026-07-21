import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "dev.science.ethiosss.org",
    "dev.science.ethioss.org",
    "*.ethiosss.org",
    "*.ethioss.org",
    "localhost:8095",
    "localhost:3000",
    "localhost:3095",
    "172.19.0.1",
  ],
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://backend:8000/api/v1";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
