import jwt from "jsonwebtoken";

const AUTH_COOKIE_NAME = "authToken";

export const COOKIE_MAX_AGE_MS = 60 * 60 * 1000;
export const COOKIE_MAX_AGE_SECONDS = COOKIE_MAX_AGE_MS / 1000;

export const JWT_SECRET =
  process.env.JWT_SECRET || "cpsc431-final-project-development-secret-key";

export function parseCookies(req) {
  const header = req.headers.cookie;

  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        const key = index >= 0 ? part.slice(0, index) : part;
        const value = index >= 0 ? part.slice(index + 1) : "";
        return [key, decodeURIComponent(value)];
      })
  );
}

export function setAuthCookie(res, token) {
  const cookieValue = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  ].join("; ");

  res.setHeader("Set-Cookie", cookieValue);
}

export function clearAuthCookie(res) {
  const cookieValue = [
    `${AUTH_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");

  res.setHeader("Set-Cookie", cookieValue);
}

export function authenticateToken(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}