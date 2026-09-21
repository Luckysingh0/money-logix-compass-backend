import crypto from "crypto";

const secret = process.env.AUTH_SECRET || "local-demo-auth-secret";
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

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
  const [scheme, token] = header.split(" ");
  const [body, signature] = token?.split(".") || [];
  if (scheme !== "Bearer" || !body || !signature) {
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
