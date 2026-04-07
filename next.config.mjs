/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Your platform's root domain
const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "yourplatform.com";

const nextConfig = {
  // ─────────────────────────────────────────────────────────────────
  // DEV ONLY — allow subdomains + custom domains to load _next assets
  // ─────────────────────────────────────────────────────────────────
  allowedDevOrigins: [
    "*.lvh.me",
    "lvh.me",
    "localhost",
    "127.0.0.1",
    // "mybusiness.localhost",
  ],

  // ─────────────────────────────────────────────────────────────────
  // PRODUCTION — custom domain static asset routing
  // ─────────────────────────────────────────────────────────────────
  ...(isProd && process.env.NEXT_PUBLIC_CDN_URL
    ? { assetPrefix: process.env.NEXT_PUBLIC_CDN_URL }
    : {}),

  // ─────────────────────────────────────────────────────────────────
  // IMAGES — allow any tenant custom domain for next/image
  // ─────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          process.env.NEXT_PUBLIC_STORAGE_HOSTNAME ||
          "your-storage.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: `**.${MAIN_DOMAIN}`,
      },
      {
        protocol: "https",
        hostname: "**",
      },
      ...(isProd
        ? []
        : [
            {
              protocol: "http",
              hostname: "**.lvh.me",
            },
            {
              protocol: "http",
              hostname: "localhost",
            },
          ]),
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // HEADERS — CORS + security headers
  // ─────────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: isProd ? `https://*.${MAIN_DOMAIN}` : "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Tenant",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // async rewrites() { return []; },
};

export default nextConfig;