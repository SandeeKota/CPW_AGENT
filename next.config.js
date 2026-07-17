/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable double rendering in dev

  images: {
    // Explicit allowlist for external image hosts
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "cdn.auth0.com",
      },
    ],

    // ✅ Unoptimized allows external images without optimization
    unoptimized: true,
  },
};

module.exports = nextConfig;
