/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Allows serving local uploaded packaging mockups directly without external loader errors
  },
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./prisma/dev.db", "./prisma/schema.prisma"],
    },
  },
};

export default nextConfig;
