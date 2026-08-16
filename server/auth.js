import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { can } from "../src/constants/roles.js";

const TOKEN_COOKIE = "teamsync_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SECRET = "teamsync-dev-secret-change-me-in-production";

export function getJwtSecret() {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be set in production. Refusing to start with a default secret.",
      );
    }
    return DEFAULT_SECRET;
  }
  return secret;
}

export function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashOpaqueToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken() {
  const raw = generateOpaqueToken();
  const expiresAt = Date.now() + 30 * 60 * 1000;
  return {
    raw,
    hash: hashOpaqueToken(raw),
    expiresAt,
  };
}

export function createInviteToken() {
  const raw = generateOpaqueToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return {
    raw,
    hash: hashOpaqueToken(raw),
    expiresAt,
  };
}

export function signSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.sessionVersion ?? 0,
    },
    getJwtSecret(),
    { expiresIn: "7d" },
  );
}

export function readSessionToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  return req.cookies?.[TOKEN_COOKIE] || null;
}

export function verifySessionToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(TOKEN_COOKIE, { path: "/" });
}

export function requireAuth(store) {
  return (req, res, next) => {
    const token = readSessionToken(req);
    const payload = verifySessionToken(token);

    if (!payload?.sub) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const user = store.users.find((entry) => entry.id === payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Session user not found." });
    }

    const currentVersion = user.sessionVersion ?? 0;
    if (payload.ver !== currentVersion) {
      return res.status(401).json({
        message: "Session is no longer valid. Please sign in again.",
      });
    }

    req.auth = payload;
    req.user = user;
    return next();
  };
}

/**
 * Role gate middleware. Use after requireAuth(store).
 * Rejects with 403 when the authenticated user's role lacks the permission.
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!can(req.user.role, permission)) {
      return res.status(403).json({
        message: `You don't have permission to ${permission.replace(/([A-Z])/g, " $1").toLowerCase()}.`,
      });
    }

    return next();
  };
}