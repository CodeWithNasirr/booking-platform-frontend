// lib/cookieConfig.js

const isProd = process.env.NODE_ENV === "production";

export const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  secure: isProd,
  ...(isProd && {
    domain: ".neoleap.ai",
  }),
};