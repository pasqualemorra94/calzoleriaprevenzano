/**
 * Seed script: Register reference site images in the Media table.
 *
 * Usage: npx tsx prisma/seed-site-images.ts
 *
 * This registers the 16 images downloaded from calzoleriaprevenzano.it
 * into the centralized Media library so they appear in admin/media
 * and can be managed via the admin UI.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface SiteImage {
  filename: string;        // stored filename in public/uploads/2026/04/
  originalName: string;    // descriptive original name
  mimeType: string;
  alt: string;
  folder: string;
  width: number | null;
  height: number | null;
}

const IMAGES: SiteImage[] = [
  // ── Hero Slider ────────────────────────────────────────
  {
    filename: "slide-gioiello-2024.jpeg",
    originalName: "slide-sfondo-gioiello2024.jpeg",
    mimeType: "image/jpeg",
    alt: "Sandali collezione gioiello — Calzoleria Prevenzano",
    folder: "hero",
    width: 2016,
    height: 1512,
  },
  {
    filename: "slide-classica.jpg",
    originalName: "immagine-slider-2.jpg",
    mimeType: "image/jpeg",
    alt: "Sandali collezione classica — Calzoleria Prevenzano",
    folder: "hero",
    width: 2048,
    height: 1012,
  },

  // ── Banner Collezioni ─────────────────────────────────
  {
    filename: "banner-gioiello-2024.jpg",
    originalName: "gioiello-2024-nuova-collezione.jpg",
    mimeType: "image/jpeg",
    alt: "Nuova collezione gioiello 2024",
    folder: "banners",
    width: null,
    height: null,
  },
  {
    filename: "banner-classica.jpg",
    originalName: "s-classico-home.jpg",
    mimeType: "image/jpeg",
    alt: "Collezione classica — sandali artigianali",
    folder: "banners",
    width: null,
    height: null,
  },
  {
    filename: "banner-schiava.jpg",
    originalName: "schiava-categoria-quarta.jpg",
    mimeType: "image/jpeg",
    alt: "Collezione schiava — sandali artigianali",
    folder: "banners",
    width: null,
    height: null,
  },
  {
    filename: "banner-bambini.jpg",
    originalName: "sandalo-bimbo2.jpg",
    mimeType: "image/jpeg",
    alt: "Collezione bambini — sandali artigianali",
    folder: "banners",
    width: null,
    height: null,
  },

  // ── Sezione Personalizzazione ─────────────────────────
  {
    filename: "personalizzazione-sandalo.jpg",
    originalName: "personalizza-sandalo.jpg",
    mimeType: "image/jpeg",
    alt: "Sandalo personalizzabile — scegli pelle, tacco e gioiello",
    folder: "personalizzazione",
    width: 700,
    height: 819,
  },
  {
    filename: "icon-sandalo.png",
    originalName: "sandal.png",
    mimeType: "image/png",
    alt: "Sandali artigianali personalizzabili",
    folder: "personalizzazione",
    width: null,
    height: null,
  },
  {
    filename: "icon-tacco.png",
    originalName: "tacco-pers.png",
    mimeType: "image/png",
    alt: "Scegli il tacco",
    folder: "personalizzazione",
    width: null,
    height: null,
  },
  {
    filename: "icon-pelle.png",
    originalName: "pelle-icon.png",
    mimeType: "image/png",
    alt: "Scegli il tipo e colore di pelle",
    folder: "personalizzazione",
    width: null,
    height: null,
  },
  {
    filename: "icon-gioiello.png",
    originalName: "gioiello-pers.png",
    mimeType: "image/png",
    alt: "Scegli il gioiello",
    folder: "personalizzazione",
    width: null,
    height: null,
  },

  // ── Chi Siamo / Team ──────────────────────────────────
  {
    filename: "sfondo-chisiamo.jpg",
    originalName: "sfondo-chisiamo.jpg",
    mimeType: "image/jpeg",
    alt: "Sfondo pagina chi siamo — Calzoleria Prevenzano",
    folder: "chi-siamo",
    width: null,
    height: null,
  },
  {
    filename: "nunzio-ritratto.jpg",
    originalName: "nunzio.jpg",
    mimeType: "image/jpeg",
    alt: "Nunzio Prevenzano — sandal maker e artigiano",
    folder: "team",
    width: 800,
    height: 1067,
  },
  {
    filename: "nunzio-team.jpg",
    originalName: "nunzio-team2-600x792.jpg",
    mimeType: "image/jpeg",
    alt: "Nunzio Prevenzano — sandal maker",
    folder: "team",
    width: 600,
    height: 792,
  },
  {
    filename: "francesca-team.jpg",
    originalName: "francy-team3-600x792.jpg",
    mimeType: "image/jpeg",
    alt: "Francesca Prevenzano — restauro e pulizia scarpe e borse",
    folder: "team",
    width: 600,
    height: 792,
  },

  // ── Guida alla Taglia ─────────────────────────────────
  {
    filename: "tutorial-misurazione-piede.png",
    originalName: "foto-piede2.png",
    mimeType: "image/png",
    alt: "Tutorial misurazione piede per trovare la taglia giusta",
    folder: "guida-taglia",
    width: null,
    height: null,
  },
];

async function main() {
  const uploadsBase = join(__dirname, "..", "public", "uploads", "2026", "04");
  let created = 0;
  let skipped = 0;

  for (const img of IMAGES) {
    // Check if already registered
    const existing = await prisma.media.findUnique({
      where: { filename: img.filename },
    });

    if (existing) {
      console.log(`  ⏭  Skipped (exists): ${img.filename}`);
      skipped++;
      continue;
    }

    // Read file size from disk
    const filePath = join(uploadsBase, img.filename);
    let size = 0;
    try {
      const stat = readFileSync(filePath);
      size = stat.byteLength;
    } catch {
      console.warn(`  ⚠  File not found: ${filePath}`);
      continue;
    }

    await prisma.media.create({
      data: {
        filename: img.filename,
        originalName: img.originalName,
        mimeType: img.mimeType,
        size,
        width: img.width,
        height: img.height,
        alt: img.alt,
        folder: img.folder,
        url: `/uploads/2026/04/${img.filename}`,
      },
    });

    console.log(`  ✅ Created: ${img.filename} (${(size / 1024).toFixed(0)}KB)`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
