import { defineEventHandler, createError, setResponseHeader } from "h3";
import { existsSync, statSync, readFile } from "node:fs";
import { join, extname } from "node:path";

const UPLOAD_BASE = process.env.UPLOAD_DIR || join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

export default defineEventHandler(async (event) => {
  const url = event.node.req.url?.split("?")[0] || "";

  if (!url.startsWith("/uploads/")) return;

  const filePath = join(UPLOAD_BASE, url.replace(/^\/uploads\/?/, ""));

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    throw createError({ statusCode: 404, message: "File not found" });
  }

  const ext = extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";

  const data = await readFile(filePath);
  setResponseHeader(event, "Content-Type", mime);
  setResponseHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
  return data;
});
