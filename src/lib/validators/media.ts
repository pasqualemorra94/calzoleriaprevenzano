/**
 * Media Validators — Zod schemas for media library operations.
 */

import { z } from "zod";
import { APP_CONFIG } from "~/lib/constants/app";

// ─── Media listing ────────────────────────────────────────────────────

export const listMediaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(APP_CONFIG.pagination.maxPageSize).default(40),
  query: z.string().optional(),
  type: z.enum(["image", "all"]).default("image"),
  folder: z.string().optional(),
  sort: z.enum(["newest", "oldest", "name", "size"]).default("newest"),
});

export type ListMediaInput = z.infer<typeof listMediaSchema>;

// ─── Media update ─────────────────────────────────────────────────────

export const updateMediaSchema = z.object({
  alt: z.string().max(500).optional(),
  folder: z.string().max(200).optional(),
  originalName: z.string().max(500).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

// ─── Upload validation (file metadata) ────────────────────────────────

export const UPLOAD_CONSTRAINTS = {
  maxFileSize: APP_CONFIG.upload.maxFileSize,
  maxFileSizeLabel: "5 MB",
  allowedMimeTypes: APP_CONFIG.upload.allowedTypes,
  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
} as const;

export function isAllowedMimeType(mimeType: string): boolean {
  return UPLOAD_CONSTRAINTS.allowedMimeTypes.includes(mimeType as typeof UPLOAD_CONSTRAINTS.allowedMimeTypes[number]);
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mimeType] ?? "bin";
}
