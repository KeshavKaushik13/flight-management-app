/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default;

/** @type {import('@ducanh2912/next-pwa').PluginOptions} */
const pwaConfig = {
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    runtimeCaching: [
      {
        // StaleWhileRevalidate for Supabase flight search API
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/flights.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "flight-search-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 300 },
        },
      },
      {
        // CacheFirst for Next.js static assets
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
        },
      },
      {
        // CacheFirst for optimised images
        urlPattern: /\/_next\/image\?.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 7 },
        },
      },
    ],
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(pwaConfig)(nextConfig);
