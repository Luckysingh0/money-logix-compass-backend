import crypto from "crypto";

const secret = process.env.AUTH_SECRET || "local-demo-auth-secret";
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET must be set when NODE_ENV=production.");
}
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const AUTH_COOKIE = "nm_auth";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAuthToken(email) {
  const payload = {
    email: String(email).trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const body = encode(payload);
  return `${body}.${sign(body)}`;
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const cookieToken = parseCookies(req.headers.cookie || "")[AUTH_COOKIE];
  const [scheme, headerToken] = header.split(" ");
  const token = cookieToken || (scheme === "Bearer" ? headerToken : "");
  const [body, signature] = token?.split(".") || [];
  if (!body || !signature) {
    return res.status(401).json({ error: "Authentication is required." });
  }

  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  const validSignature =
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer);

  if (!validSignature) {
    return res.status(401).json({ error: "Authentication is required." });
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: "Your session has expired." });
    }
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Authentication is required." });
  }
}

export function authenticatedEmail(req) {
  return req.auth?.email || null;
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.AUTH_COOKIE_SAMESITE ||
      (process.env.NODE_ENV === "production" ? "none" : "lax"),
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: "/",
  };
}

export function serializeAuthCookie(token, options = authCookieOptions()) {
  const parts = [
    `${AUTH_COOKIE}=${encodeURIComponent(token)}`,
    `Max-Age=${Math.floor((options.maxAge || 0) / 1000)}`,
    `Path=${options.path || "/"}`,
    "HttpOnly",
    `SameSite=${options.sameSite || "lax"}`,
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

function parseCookies(value) {
  return Object.fromEntries(
    value
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, cookieValue]) => key && cookieValue)
      .map(([key, ...cookieValue]) => [key, decodeURIComponent(cookieValue.join("="))]),
  );
}
