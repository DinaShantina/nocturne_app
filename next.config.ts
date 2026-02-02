import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow both ports to prevent the fetch error if the port shifts
      allowedOrigins: ["localhost:3000", "localhost:3001"],
    },
  },
  // --- ADD THIS SECTION BELOW ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
    ],
  },
  // ------------------------------
  // Ensure Turbopack uses the current directory as the strict root
  transpilePackages: ['lucide-react'], 
};

export default nextConfig;