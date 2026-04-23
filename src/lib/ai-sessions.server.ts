/**
 * AI Sessions — Server-side CRUD
 *
 * Persists AI foot analysis sessions so the admin doesn't need to
 * re-run the expensive OpenAI analysis for each try-on.
 *
 * Flow:
 *  1. analyze-foot → creates AiSession (footImage + footProfile + suggestions)
 *  2. tryon → appends to tryonHistory (keeps ALL generated images)
 *  3. Resume from history → load session with full try-on gallery
 */

import { prisma } from "~/lib/db.server";
import type { Prisma } from "@prisma/client";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("ai-sessions");

// ─── Types ─────────────────────────────────────────────────────────────

/** Single try-on entry stored in the session's tryonHistory JSON array */
export interface TryOnHistoryEntry {
  id: string;
  imageUrl: string;
  productSlug: string;
  productName: string;
  creditsUsed?: number;
  costUsd?: number;
  selectedVariants?: Array<{
    groupLabel: string;
    optionLabel: string;
    optionColor?: string;
    optionImageUrl?: string;
  }>;
  createdAt: string;
}

export interface AiSessionSummary {
  id: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
  /** Thumbnail — first 50 chars of base64 to build a data URI preview */
  footImageThumb: string;
  /** Number of try-on results in this session */
  tryonCount: number;
  /** Last try-on product name (if available) */
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
  /** Full try-on history — all generated images for this session */
  tryonHistory: TryOnHistoryEntry[];
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
      tryonHistory: true,
      analysisCost: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sessions.map((s) => {
    const history = parseTryOnHistory(s.tryonHistory);
    return {
      id: s.id,
      label: s.label,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      footImageThumb: buildThumbnail(s.footImage),
      tryonCount: history.length,
      tryonProductName: s.tryonProductId ?? null,
      analysisCost: s.analysisCost,
    };
  });
}

/**
 * Get a single session with full data (including full footImage base64 and try-on history).
 */
export async function getSession(id: string): Promise<AiSessionDetail | null> {
  const session = await prisma.aiSession.findUnique({ where: { id } });
  if (!session) return null;

  // Build try-on history: prefer new array field, fallback to legacy single-result
  let tryonHistory = parseTryonHistory(session.tryonHistory);

  // Backward compat: if no history array yet, reconstruct from legacy single-result fields
  if (tryonHistory.length === 0 && session.tryonImageUrl) {
    tryonHistory = [{
      id: crypto.randomUUID(),
      imageUrl: session.tryonImageUrl,
      productSlug: session.tryonProductId ?? "",
      productName: session.tryonProductId ?? "",
      creditsUsed: session.tryonCreditsUsed ?? undefined,
      costUsd: session.tryonCostUsd ?? undefined,
      createdAt: session.updatedAt.toISOString(),
    }];
  }

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
    tryonHistory,
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
 * Append a try-on result to the session's history.
 *
 * IMPORTANT: This APPENDS to tryonHistory (preserving all previous try-ons).
 * The single-result fields (tryonImageUrl, etc.) are also updated for backward compatibility.
 */
export async function appendTryOnToSession(params: {
  id: string;
  imageUrl: string;
  productId: string;
  productName: string;
  creditsUsed?: number;
  costUsd?: number;
  selectedVariants?: TryOnHistoryEntry["selectedVariants"];
}): Promise<TryOnHistoryEntry[]> {
  // Fetch current history
  const session = await prisma.aiSession.findUnique({
    where: { id: params.id },
    select: { tryonHistory: true },
  });

  if (!session) {
    throw new Error(`Session ${params.id} not found`);
  }

  const existingHistory = parseTryOnHistory(session.tryonHistory);

  // Build new entry
  const newEntry: TryOnHistoryEntry = {
    id: crypto.randomUUID(),
    imageUrl: params.imageUrl,
    productSlug: params.productId,
    productName: params.productName,
    creditsUsed: params.creditsUsed,
    costUsd: params.costUsd,
    selectedVariants: params.selectedVariants,
    createdAt: new Date().toISOString(),
  };

  // Append to history
  const updatedHistory = [...existingHistory, newEntry];

  // Update session — history + single-result fields (backward compat)
  await prisma.aiSession.update({
    where: { id: params.id },
    data: {
      tryonImageUrl: params.imageUrl,
      tryonProductId: params.productId,
      tryonCreditsUsed: params.creditsUsed ?? null,
      tryonCostUsd: params.costUsd ?? null,
      tryonHistory: updatedHistory as unknown as Prisma.InputJsonValue,
    },
  });

  log.info("AI session: try-on appended to history", {
    id: params.id,
    productId: params.productId,
    productName: params.productName,
    historySize: updatedHistory.length,
    creditsUsed: params.creditsUsed,
  });

  return updatedHistory;
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

// ─── Internal Helpers ──────────────────────────────────────────────────

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

// ─── Module-level Helpers (function declarations for hoisting) ────────

/** Type guard for TryOnHistoryEntry. */
function isTryOnHistoryEntry(entry: unknown): entry is TryOnHistoryEntry {
  if (!entry || typeof entry !== "object") return false;
  const obj = entry as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.imageUrl === "string" &&
    typeof obj.productSlug === "string" &&
    typeof obj.createdAt === "string"
  );
}

/** Safely parse tryonHistory from JSON. Returns empty array if null, invalid, or not an array. */
function parseTryonHistory(raw: unknown): TryOnHistoryEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(isTryOnHistoryEntry);
}
