/**
 * Auth Server — standalone implementation (server-only)
 *
 * Self-contained auth layer using Prisma + Node.js crypto.
 * Provides session management, password hashing (scrypt), and user lookup.
 *
 * NOTE: This replaces the secure-auth-sdk dependency.
 * When the SDK is available, this can be swapped back by importing from
 * secure-auth-sdk and secure-auth-sdk/adapters/prisma.
 */

import { prisma } from "./db.server";
import { createLogger } from "./logger.server";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const log = createLogger("auth");

const scryptAsync = promisify(scrypt);

// ─── Startup Validation ─────────────────────────────────────────────

if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  throw new Error(
    "[auth] AUTH_SECRET must be set and at least 32 characters long. " +
      "Generate one with: openssl rand -base64 32",
  );
}

if (!process.env.APP_URL) {
  throw new Error(
    "[auth] APP_URL must be set (e.g. https://example.com). " +
      "Required for email verification links and password reset URLs.",
  );
}

// ─── Types ──────────────────────────────────────────────────────────

interface AuthUserRecord {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}

// ─── Password Hashing (scrypt) ───────────────────────────────────────

const SCRYPT_KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(hashHex, "hex");

  try {
    const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN) as Buffer;
    return timingSafeEqual(derivedKey, storedKey);
  } catch {
    return false;
  }
}

// ─── Session Management ─────────────────────────────────────────────

const SESSION_COOKIE_NAME = "sid";
const SESSION_MAX_AGE_DAYS = 30;

/** Parse session token from cookie header */
export function getSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

/** Create a new session for a user and return the session token */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.authSession.create({
    data: {
      id: token,
      userId,
      expiresAt,
    },
  });

  return token;
}

/** Validate a session token and return the user (or null) */
export async function validateSession(sessionToken: string | null): Promise<AuthUserRecord | null> {
  if (!sessionToken) return null;

  const session = await prisma.authSession.findUnique({
    where: { id: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await prisma.authSession.delete({ where: { id: sessionToken } }).catch(() => {});
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    emailVerified: session.user.emailVerified,
  };
}

/** Delete a session (logout) */
export async function deleteSession(sessionToken: string): Promise<void> {
  await prisma.authSession.delete({ where: { id: sessionToken } }).catch(() => {});
}

/** Get user by email (for login flow) */
export async function getUserByEmail(email: string) {
  return prisma.authUser.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      passwordHash: true,
      lockedUntil: true,
      lockedPermanently: true,
    },
  });
}

/** Create a new user */
export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
}) {
  return prisma.authUser.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role ?? "user",
    },
  });
}

/** Build Set-Cookie header value for a session */
export function buildSessionCookie(sessionToken: string): string {
  const maxAge = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
  return `${SESSION_COOKIE_NAME}=${sessionToken}; HttpOnly; ${secure} SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

/** Build Set-Cookie header to clear session */
export function buildClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

// ─── Lockout Check ──────────────────────────────────────────────────

export async function isUserLocked(userId: string): Promise<boolean> {
  const user = await prisma.authUser.findUnique({
    where: { id: userId },
    select: { lockedUntil: true, lockedPermanently: true },
  });

  if (!user) return false;
  if (user.lockedPermanently) return true;
  if (user.lockedUntil && user.lockedUntil > new Date()) return true;

  // Clear expired lockout
  if (user.lockedUntil) {
    await prisma.authUser.update({
      where: { id: userId },
      data: { lockedUntil: null },
    });
  }

  return false;
}

/** Record a failed login attempt */
export async function recordFailedAttempt(userId: string): Promise<void> {
  const lockout = await prisma.authLockout.findFirst({
    where: { userId },
  });

  const failedAttempts = (lockout?.failedAttempts ?? 0) + 1;
  const now = new Date();

  if (failedAttempts >= 20) {
    // Permanent lockout
    await prisma.authUser.update({
      where: { id: userId },
      data: { lockedPermanently: true },
    });
    log.error("Permanent lockout triggered", { userId });
  } else if (failedAttempts >= 5) {
    // Temporary lockout (15 min)
    await prisma.authUser.update({
      where: { id: userId },
      data: { lockedUntil: new Date(now.getTime() + 15 * 60 * 1000) },
    });
    log.warn("Temporary lockout triggered", { userId, failedAttempts });
  }

  await prisma.authLockout.upsert({
    where: { id: `${userId}_lockout` },
    create: { id: `${userId}_lockout`, userId, failedAttempts, lastAttemptAt: now },
    update: { failedAttempts, lastAttemptAt: now },
  });

  // Clear failed attempts on success is handled by clearFailedAttempts()
}

/** Clear failed attempts after successful login */
export async function clearFailedAttempts(userId: string): Promise<void> {
  await prisma.authLockout.deleteMany({ where: { userId } });
}

/** Audit log helper */
export async function auditLog(data: {
  userId?: string;
  event: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
}): Promise<void> {
  await prisma.authAuditLog.create({
    data: {
      userId: data.userId ?? null,
      event: data.event,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      metadata: data.metadata ?? undefined,
    },
  }).catch(() => {
    // Audit log failure should not block the flow
  });
}
