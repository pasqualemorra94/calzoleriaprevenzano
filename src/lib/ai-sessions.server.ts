/**
 * AI Sessions — Server-side CRUD
 *
 * Persists AI foot analysis sessions so the admin doesn't need to
 * re-run the expensive OpenAI analysis for each try-on.
 *
 * Flow:
 *  1. analyze-foot → creates AiSession (footImage + footProfile + suggestions)
 *  2. tryon → updates AiSession with try-on result
 *  3. Resume from history → load session, skip to step 2
 */

import { prisma } from "~/lib/db.server";
import type { Prisma } from "@prisma/client";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("ai-sessions");

// ─── Types ─────────────────────────────────────────────────────────────

export interface AiSessionSummary {
  id: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
  /** Thumbnail — first 50 chars of base64 to build a data URI preview */
  footImageThumb: string;
  /** Has try-on result */
  hasTryon: boolean;
  /** Try-on product name (if available) */
  tryonProductName: string | null;
  analysisCost: number | null;
}

export interface AiSessionDetail {
  id: string;
  label: string | null;
  footImage: string;
  footProfile: unknown;
  suggestions: unknown;
  analysisCost: number | null;
  tryonImageUrl: string | null;
  tryonProductId: string | null;
  tryonCreditsUsed: number | null;
  tryonCostUsd: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * List all AI sessions, newest first.
 * Returns summary with thumbnail (not full base64 image).
 */
export async function listSessions(limit = 20): Promise<AiSessionSummary[]> {
  const sessions = await prisma.aiSession.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      label: true,
      footImage: true,
      tryonImageUrl: true,
      tryonProductId: true,
      analysisCost: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    label: s.label,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    footImageThumb: buildThumbnail(s.footImage),
    hasTryon: s.tryonImageUrl !== null,
    tryonProductName: s.tryonProductId ?? null,
    analysisCost: s.analysisCost,
  }));
}

/**
 * Get a single session with full data (including full footImage base64).
 */
export async function getSession(id: string): Promise<AiSessionDetail | null> {
  const session = await prisma.aiSession.findUnique({ where: { id } });
  if (!session) return null;

  return {
    id: session.id,
    label: session.label,
    footImage: session.footImage,
    footProfile: session.footProfile,
    suggestions: session.suggestions,
    analysisCost: session.analysisCost,
    tryonImageUrl: session.tryonImageUrl,
    tryonProductId: session.tryonProductId,
    tryonCreditsUsed: session.tryonCreditsUsed,
    tryonCostUsd: session.tryonCostUsd,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

/**
 * Create a new session after foot analysis.
 */
export async function createSession(params: {
  footImage: string;
  footProfile: unknown;
  suggestions: unknown;
  analysisCost: number;
  label?: string;
}): Promise<string> {
  const session = await prisma.aiSession.create({
    data: {
      footImage: params.footImage,
      footProfile: params.footProfile as Prisma.InputJsonValue,
      suggestions: params.suggestions as Prisma.NullableJsonNullValueInput,
      analysisCost: params.analysisCost,
      label: params.label ?? null,
    },
  });

  log.info("AI session created", { id: session.id, costUsd: params.analysisCost });
  return session.id;
}

/**
 * Update session with try-on result.
 */
export async function updateSessionTryOn(params: {
  id: string;
  imageUrl: string;
  productId: string;
  creditsUsed?: number;
  costUsd?: number;
}): Promise<void> {
  await prisma.aiSession.update({
    where: { id: params.id },
    data: {
      tryonImageUrl: params.imageUrl,
      tryonProductId: params.productId,
      tryonCreditsUsed: params.creditsUsed ?? null,
      tryonCostUsd: params.costUsd ?? null,
    },
  });

  log.info("AI session updated with try-on", {
    id: params.id,
    productId: params.productId,
    creditsUsed: params.creditsUsed,
  });
}

/**
 * Update session label.
 */
export async function updateSessionLabel(id: string, label: string): Promise<void> {
  await prisma.aiSession.update({
    where: { id },
    data: { label },
  });
}

/**
 * Delete a session.
 */
export async function deleteSession(id: string): Promise<boolean> {
  try {
    await prisma.aiSession.delete({ where: { id } });
    log.info("AI session deleted", { id });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get total AI cost across all sessions.
 */
export async function getTotalCost(): Promise<{ totalUsd: number; sessionCount: number }> {
  const result = await prisma.aiSession.aggregate({
    _sum: { analysisCost: true, tryonCostUsd: true },
    _count: true,
  });

  const analysisTotal = result._sum.analysisCost ?? 0;
  const tryonTotal = result._sum.tryonCostUsd ?? 0;

  return {
    totalUsd: Number((analysisTotal + tryonTotal).toFixed(4)),
    sessionCount: result._count,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Build a tiny thumbnail from a base64 data URI.
 * Extracts the first 100 chars of the base64 payload to create a preview.
 */
function buildThumbnail(footImage: string): string {
  if (!footImage.startsWith("data:")) {
    // Raw base64 — return empty (no preview)
    return "";
  }

  // Extract MIME and first chunk
  const match = footImage.match(/^(data:image\/\w+;base64,)(.{1,100})/);
  if (!match) return "";

  // Return truncated data URI (browser will show partial image or broken icon)
  return `${match[1]}${match[2]}...`;
}
