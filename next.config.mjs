/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Allows serving local uploaded packaging mockups directly without external loader errors
  },
};

export default nextConfig;
