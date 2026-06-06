export const COOKIE_OPTIONS = {
  domain:
    process.env.NODE_ENV === "development"
      ? ".lvh.me"
      : ".yourplatform.com",

  path: "/",
  sameSite: "lax",
};