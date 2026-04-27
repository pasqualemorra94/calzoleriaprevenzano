/**
 * Media Service — server-only
 *
 * Handles media library operations: upload, listing, CRUD, image dimensions.
 * Files are stored in public/uploads/YYYY/MM/ with unique filenames.
 * All functions assume the caller has verified admin auth.
 */

import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";
import type { ListMediaInput, UpdateMediaInput } from "~/lib/validators/media";
import { UPLOAD_CONSTRAINTS,
  isAllowedMimeType,
  getExtensionFromMime,
} from "~/lib/validators/media";

const UPLOAD_BASE = process.env.UPLOAD_DIR || join(process.cwd(), "public", "uploads");

// ─── Types ──────────────────────────────────────────────────────────

export interface MediaListItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  url: string;
  createdAt: string;
}

export interface MediaDetail extends MediaListItem {
  uploadedById: string | null;
  uploadedByName: string | null;
}

interface ImageDimensions {
  width: number;
  height: number;
}

// ─── Upload ─────────────────────────────────────────────────────────

/**
 * Process and save an uploaded file to disk, then create a Media record.
 * Returns the created Media record as a list item.
 */
export async function uploadMedia(file: File, adminUserId: string, folder = ""): Promise<MediaListItem> {
  // Validate MIME type
  if (!isAllowedMimeType(file.type)) {
    throw new Error(
      `Tipo file non consentito. Formati accettati: ${UPLOAD_CONSTRAINTS.allowedExtensions.join(", ")}`,
    );
  }

  // Validate file size
  if (file.size > UPLOAD_CONSTRAINTS.maxFileSize) {
    throw new Error(
      `File troppo grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Massimo ${UPLOAD_CONSTRAINTS.maxFileSizeLabel}.`,
    );
  }

  // Validate file has content
  if (file.size === 0) {
    throw new Error("Il file è vuoto.");
  }

  // Generate unique filename
  const now = new Date();
  const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ext = getExtensionFromMime(file.type);
  const timestamp = now.getTime();
  const randomHex = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${randomHex}.${ext}`;

  // Ensure directory exists
  const uploadsDir = join(UPLOAD_BASE, datePath);
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Write file to disk
  const filePath = join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Get image dimensions (if image)
  const dimensions = await getImageDimensions(file);

  // Extract original name from file object
  const originalName = (file instanceof File ? file.name : `upload.${ext}`) || `upload.${ext}`;

  // Create DB record
  const media = await prisma.media.create({
    data: {
      filename,
      originalName,
      mimeType: file.type,
      size: file.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      folder,
      url: `/uploads/${datePath}/${filename}`,
      uploadedById: adminUserId,
    },
  });

  return toMediaListItem(media);
}

/**
 * Delete a media record and its file from disk.
 */
export async function deleteMedia(id: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Media non trovato");

  // Check if media is used by any product images
  const usageCount = await prisma.productImage.count({
    where: { mediaId: id },
  });
  if (usageCount > 0) {
    throw new Error(
      `Impossibile eliminare: questo media è usato in ${usageCount} prodotto/i.`,
    );
  }

  // Delete file from disk
  const filePath = join(UPLOAD_BASE, media.url.replace(/^\/uploads\/?/, ""));
  try {
    await unlink(filePath);
  } catch {
    // File might already be deleted — non-critical
  }

  // Delete DB record
  await prisma.media.delete({ where: { id } });
}

// ─── Listing ────────────────────────────────────────────────────────

export async function listMedia(
  input: ListMediaInput,
): Promise<PaginatedData<MediaListItem>> {
  const { page, perPage, query, type, folder, sort } = input;
  const skip = (page - 1) * perPage;

  const conditions: Record<string, unknown>[] = [];

  if (type === "image") {
    conditions.push({ mimeType: { startsWith: "image/" } });
  }

  if (folder !== undefined && folder !== "") {
    conditions.push({ folder });
  } else if (folder === "") {
    // Don't filter by folder
  }

  if (query) {
    conditions.push({
      OR: [
        { originalName: { contains: query, mode: "insensitive" } },
        { alt: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const orderBy = getMediaOrderBy(sort);

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
    }),
    prisma.media.count({ where }),
  ]);

  return {
    items: items.map(toMediaListItem),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

// ─── Detail ─────────────────────────────────────────────────────────

export async function getMedia(id: string): Promise<MediaDetail | null> {
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  if (!media) return null;

  return {
    ...toMediaListItem(media),
    uploadedById: media.uploadedById,
    uploadedByName: media.uploadedBy?.name ?? null,
  };
}

// ─── Update ─────────────────────────────────────────────────────────

export async function updateMedia(id: string, data: UpdateMediaInput): Promise<MediaListItem> {
  const media = await prisma.media.update({
    where: { id },
    data,
  });
  return toMediaListItem(media);
}

// ─── Stats ──────────────────────────────────────────────────────────

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  totalImages: number;
  folders: Array<{ name: string; count: number }>;
}

export async function getMediaStats(): Promise<MediaStats> {
  const [totalFiles, totalSize, totalImages, folderAgg] = await Promise.all([
    prisma.media.count(),
    prisma.media.aggregate({ _sum: { size: true } }),
    prisma.media.count({ where: { mimeType: { startsWith: "image/" } } }),
    prisma.media.groupBy({
      by: ["folder"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  return {
    totalFiles,
    totalSize: totalSize._sum.size ?? 0,
    totalImages,
    folders: folderAgg.map((f: { folder: string; _count: { id: number } }) => ({ name: f.folder || "Senza cartella", count: f._count.id })),
  };
}

// ─── Helpers ───────────────────────────────────────────────────────

function getMediaOrderBy(sort: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    name: { originalName: "asc" },
    size: { size: "desc" },
  };
  return map[sort] ?? { createdAt: "desc" };
}

function toMediaListItem(media: {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  url: string;
  createdAt: Date;
}): MediaListItem {
  return {
    id: media.id,
    filename: media.filename,
    originalName: media.originalName,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
    alt: media.alt,
    folder: media.folder,
    url: media.url,
    createdAt: media.createdAt.toISOString(),
  };
}

/**
 * Extract image dimensions from a File using Image API (Node 18+).
 */
async function getImageDimensions(file: File): Promise<ImageDimensions | null> {
  if (!file.type.startsWith("image/")) return null;

  try {
    // Use Image constructor (available in Node 18+ via global scope or via browser)
    // In TanStack Start server context, we can use a simple buffer approach
    // For reliability, we'll try to parse the buffer for PNG/JPEG dimensions
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "image/png") {
      // PNG dimensions are at bytes 16-23 (width and height, both 4 bytes big-endian)
      if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
    }

    if (file.type === "image/jpeg") {
      // JPEG dimensions require parsing EXIF/SOF markers
      return parseJpegDimensions(buffer);
    }

    // WebP: dimensions at bytes 24-31 (little-endian, after RIFF header)
    if (file.type === "image/webp" && buffer.length >= 30) {
      // Simple VP8X or VP8 detection
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
        // VP8X
        const width = buffer.readUIntLE(24, 3) + 1;
        const height = buffer.readUIntLE(27, 3) + 1;
        if (width > 0 && height > 0) return { width, height };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse JPEG dimensions by finding SOF0/SOF2 markers.
 */
function parseJpegDimensions(buffer: Buffer): ImageDimensions | null {
  let offset = 2; // Skip SOI marker

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) break;

    const marker = buffer[offset + 1];

    // SOF0 (0xC0) or SOF2 (0xC2) — baseline or progressive
    if (marker === 0xc0 || marker === 0xc2) {
      if (offset + 8 < buffer.length) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
      break;
    }

    // Skip markers with no length (RST markers, etc.)
    if (marker === 0xd0 || marker === 0xd1 || marker === 0xd2 || marker === 0xd3 ||
        marker === 0xd4 || marker === 0xd5 || marker === 0xd6 || marker === 0xd7 ||
        marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
      offset += 2;
      continue;
    }

    // Read segment length and skip
    if (offset + 3 < buffer.length) {
      const segLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLength;
    } else {
      break;
    }
  }

  return null;
}


