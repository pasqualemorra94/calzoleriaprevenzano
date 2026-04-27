import { createFileRoute } from "@tanstack/react-router";
import { readFile, existsSync, statSync } from "node:fs";
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
  ".avif": "image/avif",
};

export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const filePath = join(UPLOAD_BASE, url.pathname.replace(/^\/uploads\/?/, ""));

        if (!existsSync(filePath) || !statSync(filePath).isFile()) {
          return new Response("Not found", { status: 404 });
        }

        const ext = extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || "application/octet-stream";
        const data = await readFile(filePath);

        return new Response(data, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
