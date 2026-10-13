/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native Node addon — it must NOT be bundled by
  // webpack. Keep it external so `require('better-sqlite3')` resolves
  // to the real module in node_modules at runtime.
  serverComponentsExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

module.exports = nextConfig;
