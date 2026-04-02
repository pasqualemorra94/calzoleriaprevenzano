import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

// ─── Categories ──────────────────────────────────────────────────────────────

interface CategorySeed {
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  parentId: string | null;
}

const categories: CategorySeed[] = [
  {
    name: "Sandali",
    slug: "sandali",
    description:
      "Sandali artigianali fatti a mano, realizzati con pellami pregiati italiani. Personalizzabili nel tipo di pelle, colore e tacco.",
    sortOrder: 1,
    parentId: null,
  },
  {
    name: "Classici",
    slug: "classici",
    description: "Sandali classici con infradito, personalizzabili in pelle, colore e tacco.",
    sortOrder: 1,
    parentId: "sandali",
  },
  {
    name: "Gioiello",
    slug: "gioiello",
    description:
      "Sandali della collezione gioiello con infradito, personalizzabili con gioiello e tacco.",
    sortOrder: 2,
    parentId: "sandali",
  },
  {
    name: "Bambini",
    slug: "bambini",
    description: "Sandali artigianali per bambini, morbidi e confortevoli.",
    sortOrder: 3,
    parentId: "sandali",
  },
  {
    name: "Pelletteria",
    slug: "pelletteria",
    description:
      "Borselli, cinture e accessori in pelle artigianale, lavorati a mano con pellami italiani di prima qualità.",
    sortOrder: 2,
    parentId: null,
  },
  {
    name: "Borselli",
    slug: "borselli",
    description: "Borselli in pelle artigianale, disponibili in vari colori e modelli.",
    sortOrder: 1,
    parentId: "pelletteria",
  },
  {
    name: "Cinture",
    slug: "cinture",
    description: "Cinture in pelle di vitello, lavorate a mano in varie colorazioni.",
    sortOrder: 2,
    parentId: "pelletteria",
  },
  {
    name: "Agende",
    slug: "agende",
    description: "Agende e quaderni in pelle artigianale.",
    sortOrder: 3,
    parentId: "pelletteria",
  },
  {
    name: "Accessori",
    slug: "accessori-calzoleria",
    description: "Accessori per la cura delle calzature e articoli da pelletteria.",
    sortOrder: 4,
    parentId: "pelletteria",
  },
  {
    name: "Articoli per calzature",
    slug: "articoli-calzature",
    description:
      "Prodotti per la cura e la manutenzione delle vostre calzature preferite.",
    sortOrder: 3,
    parentId: null,
  },
  {
    name: "Solette",
    slug: "solette",
    description: "Solette in cuoio e materiali naturali per il comfort delle vostre calzature.",
    sortOrder: 1,
    parentId: "articoli-calzature",
  },
];

// ─── Products ────────────────────────────────────────────────────────────────

interface ProductSeed {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  materials: string | null;
  categorySlug: string;
  images: Array<{ url: string; alt: string; sortOrder: number }>;
  variants: Array<{
    name: string;
    color: string | null;
    size: string | null;
    price: number | null;
    stock: number;
    sortOrder: number;
  }>;
}

const TACCO_VARIANTS = [
  { name: "No tacco", color: null, size: "No tacco", price: 0, stock: 10, sortOrder: 1 },
  {
    name: "Tacco 2.5 cm (+€10)",
    color: null,
    size: "Tacco 2.5 cm",
    price: 10,
    stock: 10,
    sortOrder: 2,
  },
  {
    name: "Tacco 5 cm (+€10)",
    color: null,
    size: "Tacco 5 cm",
    price: 10,
    stock: 10,
    sortOrder: 3,
  },
];

const products: ProductSeed[] = [
  // ── Borselli ──────────────────────────────────────────────────────────
  {
    name: "Borsello Verde",
    slug: "borsello-verde",
    description:
      "Borsello in pelle verde, lavorato a mano dai nostri artigiani. Chiusura con zip e tracolla regolabile. Perfetto per l'uso quotidiano con un tocco di colore naturale.",
    shortDescription: "Borsello in pelle verde, lavorato a mano.",
    price: 45.0,
    compareAtPrice: null,
    sku: "CP-BVL-001",
    isActive: true,
    isFeatured: false,
    stock: 8,
    materials: "Pelle",
    categorySlug: "borselli",
    images: [
      {
        url: "/images/products/Borsello-Verde-45E_risultato.png",
        alt: "Borsello Verde in pelle",
        sortOrder: 1,
      },
    ],
    variants: [],
  },
  {
    name: "Borsello Cuoio",
    slug: "borsello-cuoio",
    description:
      "Borsello in cuoio naturale, con patina che si arricchisce nel tempo. Tracolla in cuoio intrecciato e chiusura con fibbia. Un accessorio senza tempo che migliora con l'uso.",
    shortDescription: "Borsello in cuoio naturale con fibbia.",
    price: 45.0,
    compareAtPrice: null,
    sku: "CP-BCO-002",
    isActive: true,
    isFeatured: true,
    stock: 8,
    materials: "Cuoio",
    categorySlug: "borselli",
    images: [
      {
        url: "/images/products/Borsello-Cuoio-45E_risultato.png",
        alt: "Borsello Cuoio naturale",
        sortOrder: 1,
      },
    ],
    variants: [],
  },
  {
    name: "Borsello Nero",
    slug: "borsello-nero",
    description:
      "Borsello nero in pelle, elegante e versatile. Adatto a ogni occasione, dal casual al formale. Cuciture a mano e finiture curate nei dettagli.",
    shortDescription: "Borsello nero in pelle, elegante e versatile.",
    price: 45.0,
    compareAtPrice: null,
    sku: "CP-BNR-003",
    isActive: true,
    isFeatured: false,
    stock: 8,
    materials: "Pelle",
    categorySlug: "borselli",
    images: [
      {
        url: "/images/products/Borsello-Nero45E_risultato.png",
        alt: "Borsello Nero in pelle",
        sortOrder: 1,
      },
    ],
    variants: [],
  },
  {
    name: "Borsello Blu",
    slug: "borsello-blu",
    description:
      "Borsello in pelle blu, un tocco di colore sofisticato per il vostro look quotidiano. Lavorato a mano con pellame italiano di prima scelta.",
    shortDescription: "Borsello blu in pelle italiana.",
    price: 45.0,
    compareAtPrice: null,
    sku: "CP-BBL-004",
    isActive: true,
    isFeatured: false,
    stock: 8,
    materials: "Pelle",
    categorySlug: "borselli",
    images: [
      {
        url: "/images/products/Borsello-Blu-45E_risultato.png",
        alt: "Borsello Blu in pelle",
        sortOrder: 1,
      },
    ],
    variants: [],
  },
  {
    name: "Borsello Porta Telefono Stampato Cocco",
    slug: "borsello-porta-telefono-cocco",
    description:
      "Borsello porta telefono con finitura stampata cocco. Comodo e compatto, con tracolla regolabile e chiusura con zip. Perfetto per chi cerca praticità senza rinunciare allo stile.",
    shortDescription: "Borsello porta telefono stampato cocco.",
    price: 49.9,
    compareAtPrice: null,
    sku: "CP-BPC-005",
    isActive: true,
    isFeatured: true,
    stock: 6,
    materials: "Pelle stampata cocco",
    categorySlug: "borselli",
    images: [
      {
        url: "/images/products/Borsello-Portatelefono-Stampato-Cocco_risultato.png",
        alt: "Borsello Porta Telefono Stampato Cocco",
        sortOrder: 1,
      },
    ],
    variants: [],
  },
  {
    name: "Borsello Porta Telefono Nero",
    slug: "borsello-porta-telefono-nero",
    description:
      "Borsello porta telefono nero in pelle liscia. Design minimal e pulito, con tracolla regolabile. L'accessorio perfetto per portare il telefono con stile.",
    shortDescription: "Borsello porta telefono nero in pelle.",
    price: 49.9,
    compareAtPrice: null,
    sku: "CP-BPN-006",
    isActive: true,
    isFeatured: false,
    stock: 6,
    materials: "Pelle",
    categorySlug: "borselli",
    images: [
      {
        url: "/images/products/Borsello-Portatelefono-Nero_risultato.png",
        alt: "Borsello Porta Telefono Nero",
        sortOrder: 1,
      },
    ],
    variants: [],
  },

  // ── Cinture ───────────────────────────────────────────────────────────
  {
    name: "Cintura Vitello 030",
    slug: "cintura-vitello-030",
    description:
      "Cintura in pelle di vitello modello 030, disponibile in tre colorazioni: testa di moro, blu e nero. Finitura elegante con fibbia classica. Un accessorio essenziale per completare ogni outfit.",
    shortDescription: "Cintura in vitello 030, tre colorazioni disponibili.",
    price: 25.0,
    compareAtPrice: null,
    sku: "CP-CV030-007",
    isActive: true,
    isFeatured: true,
    stock: 24,
    materials: "Pelle di vitello",
    categorySlug: "cinture",
    images: [
      {
        url: "/images/products/Vitello-030-Testa-di-moro-25E_risultato.png",
        alt: "Cintura Vitello 030 Testa di moro",
        sortOrder: 1,
      },
      {
        url: "/images/products/Vitello-030-Blu-25E_risultato-1.png",
        alt: "Cintura Vitello 030 Blu",
        sortOrder: 2,
      },
      {
        url: "/images/products/Vitello-030-Nero-25E_risultato.png",
        alt: "Cintura Vitello 030 Nero",
        sortOrder: 3,
      },
    ],
    variants: [
      {
        name: "Testa di moro",
        color: "Testa di moro",
        size: null,
        price: null,
        stock: 8,
        sortOrder: 1,
      },
      {
        name: "Blu",
        color: "Blu",
        size: null,
        price: null,
        stock: 8,
        sortOrder: 2,
      },
      {
        name: "Nero",
        color: "Nero",
        size: null,
        price: null,
        stock: 8,
        sortOrder: 3,
      },
    ],
  },
  {
    name: "Cintura Vitello 035 Nero",
    slug: "cintura-vitello-035-nero",
    description:
      "Cintura in pelle di vitello modello 035, colore nero. Un modello essenziale e raffinato, lavorato a mano con cuoio italiano di alta qualità.",
    shortDescription: "Cintura vitello 035 nera, lavorazione artigianale.",
    price: 25.0,
    compareAtPrice: null,
    sku: "CP-CV035-008",
    isActive: true,
    isFeatured: false,
    stock: 8,
    materials: "Pelle di vitello",
    categorySlug: "cinture",
    images: [
      {
        url: "/images/products/Vitello-035-Nero-25E_risultato.png",
        alt: "Cintura Vitello 035 Nero",
        sortOrder: 1,
      },
    ],
    variants: [],
  },

  // ── Accessori ─────────────────────────────────────────────────────────
  {
    name: "Astuccio Cubo Nero",
    slug: "astuccio-cubo-nero",
    description:
      "Astuccio cubo nero in pelle, ideale per conservare ochiali, piccoli oggetti o come elegante portaoggetti da viaggio. Lavorato a mano con cuciture visibili e chiusura con zip.",
    shortDescription: "Astuccio cubo nero in pelle.",
    price: 20.0,
    compareAtPrice: null,
    sku: "CP-ACN-009",
    isActive: true,
    isFeatured: false,
    stock: 10,
    materials: "Pelle",
    categorySlug: "accessori-calzoleria",
    images: [
      {
        url: "/images/products/Astuccio-Cubo-Nero_risultato.png",
        alt: "Astuccio Cubo Nero",
        sortOrder: 1,
      },
    ],
    variants: [],
  },
  {
    name: "Astuccio Cubo Blu",
    slug: "astuccio-cubo-blu",
    description:
      "Astuccio cubo blu in pelle, pratica eleganza per il quotidiano. Perfetto come portaochiali o portaoggetti, con cuciture a mano e chiusura con zip.",
    shortDescription: "Astuccio cubo blu in pelle.",
    price: 20.0,
    compareAtPrice: null,
    sku: "CP-ACB-010",
    isActive: true,
    isFeatured: false,
    stock: 10,
    materials: "Pelle",
    categorySlug: "accessori-calzoleria",
    images: [
      {
        url: "/images/products/Astuccio-Cubo-Blu-20E_risultato.png",
        alt: "Astuccio Cubo Blu",
        sortOrder: 1,
      },
    ],
    variants: [],
  },

  // ── Sandali Classici ──────────────────────────────────────────────────
  {
    name: "Noemi",
    slug: "noemi",
    description:
      "Sandalo classico con infradito, personalizzabile nel tipo di pelle, colore e tacco. Disponibile in taglie dalla 32 alla 42. Realizzato interamente a mano con pellami pregiati italiani. Le opzioni di personalizzazione includono: tipo di pelle (Laminato, Liscio, Pitone), vasta gamma di colori e tre altezze di tacco. La suola in cuoio garantisce comfort e durabilità nel tempo.",
    shortDescription:
      "Sandalo classico con infradito, personalizzabile in pelle, colore e tacco. Taglie 32-42.",
    price: 70.0,
    compareAtPrice: null,
    sku: "CP-NMI-011",
    isActive: true,
    isFeatured: true,
    stock: 30,
    materials: "Pelle (Laminato, Liscio, Pitone)",
    categorySlug: "classici",
    images: [
      {
        url: "/images/products/Noemi-70E1-dimensioni-grandi.jpeg",
        alt: "Sandalo Noemi vista principale",
        sortOrder: 1,
      },
      {
        url: "/images/products/Noemi-70E2-dimensioni-grandi.jpeg",
        alt: "Sandalo Noemi vista laterale",
        sortOrder: 2,
      },
      {
        url: "/images/products/Noemi-70E3-dimensioni-grandi.jpeg",
        alt: "Sandalo Noemi dettaglio suola",
        sortOrder: 3,
      },
    ],
    variants: TACCO_VARIANTS,
  },

  // ── Sandali Gioiello ──────────────────────────────────────────────────
  {
    name: "Medaglia",
    slug: "medaglia",
    description:
      "Sandalo collezione gioiello con infradito. Personalizzabile con gioiello e tacco. Un sandalo unico che unisce la maestria artigianale della pelletteria italiana all'eleganza di gioielli applicati a mano. Disponibile con diverse opzioni di tacco per adattarsi a ogni stile e occasione.",
    shortDescription:
      "Sandalo collezione gioiello con infradito, personalizzabile con gioiello e tacco.",
    price: 130.0,
    compareAtPrice: null,
    sku: "CP-MDG-012",
    isActive: true,
    isFeatured: true,
    stock: 20,
    materials: "Pelle, gioielli applicati a mano",
    categorySlug: "gioiello",
    images: [
      {
        url: "/images/products/Noemi-70E1-dimensioni-grandi.jpeg",
        alt: "Sandalo Medaglia - immagine temporanea",
        sortOrder: 1,
      },
    ],
    variants: TACCO_VARIANTS,
  },
  {
    name: "Margherita",
    slug: "margherita",
    description:
      "Sandalo gioiello elegante con choice of gioiello. La lavorazione artigianale si fonde con dettagli preziosi per creare un sandalo che rende speciale ogni occasione. Personalizzabile con diverse opzioni di tacco per il massimo comfort.",
    shortDescription: "Sandalo gioiello elegante, personalizzabile con gioiello.",
    price: 110.0,
    compareAtPrice: null,
    sku: "CP-MRG-013",
    isActive: true,
    isFeatured: true,
    stock: 20,
    materials: "Pelle, gioielli applicati a mano",
    categorySlug: "gioiello",
    images: [
      {
        url: "/images/products/Noemi-70E1-dimensioni-grandi.jpeg",
        alt: "Sandalo Margherita - immagine temporanea",
        sortOrder: 1,
      },
    ],
    variants: TACCO_VARIANTS,
  },
];

// ─── Discount Codes ─────────────────────────────────────────────────────────

interface DiscountSeed {
  code: string;
  type: string;
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  startsAt: Date;
  expiresAt: Date;
}

const discountCodes: DiscountSeed[] = [
  {
    code: "BENVENUTO10",
    type: "percentage",
    value: 10,
    minOrder: null,
    maxUses: 500,
    startsAt: new Date("2025-01-01"),
    expiresAt: new Date("2027-12-31"),
  },
  {
    code: "ESTATE2026",
    type: "percentage",
    value: 15,
    minOrder: 100,
    maxUses: 200,
    startsAt: new Date("2026-06-01"),
    expiresAt: new Date("2026-09-30"),
  },
];

// ─── Reviews ─────────────────────────────────────────────────────────────────

interface ReviewSeed {
  productSlug: string;
  authorEmail: string;
  authorName: string;
  rating: number;
  title: string;
  content: string;
}

const reviews: ReviewSeed[] = [
  {
    productSlug: "noemi",
    authorEmail: "maria.rossi@email.it",
    authorName: "Maria Rossi",
    rating: 5,
    title: "Comodi e bellissimi!",
    content:
      "Ho comprato i sandali Noemi per le vacanze estive e sono rimasta incantata. La pelle è morbidissima, sembrano fatti su misura. La qualità si sente appena li indossi. Li consiglio vivamente!",
  },
  {
    productSlug: "noemi",
    authorEmail: "giulia.bianchi@email.it",
    authorName: "Giulia Bianchi",
    rating: 5,
    title: "Qualità artigianale eccellente",
    content:
      "Finalmente un sandalo che unisce stile e comfort. Ho scelto il tacco 2.5 cm e sono perfetti. Le cuciture sono impeccabili!",
  },
  {
    productSlug: "borsello-cuoio",
    authorEmail: "alessandro.conti@email.it",
    authorName: "Alessandro Conti",
    rating: 5,
    title: "Lavorazione impeccabile",
    content:
      "Le cuciture a mano sono evidenti e curate. La pelle è spessa ma morbida. Lo sto usando da mesi e si sta patinando magnificamente.",
  },
  {
    productSlug: "cintura-vitello-030",
    authorEmail: "luca.moretti@email.it",
    authorName: "Luca Moretti",
    rating: 4,
    title: "Ottimo rapporto qualità-prezzo",
    content:
      "Ho preso la versione testa di moro ed è bellissima. Il cuoio è di ottima qualità e la fibbia è solida. Lo consiglio.",
  },
  {
    productSlug: "medaglia",
    authorEmail: "francesca.verdi@email.it",
    authorName: "Francesca Verdi",
    rating: 5,
    title: "Un vero gioiello",
    content:
      "Il sandalo Medaglia è stupendo. I dettagli gioiello fanno la differenza. Indossati a un matrimonio e ho ricevuto tantissimi complimenti!",
  },
  {
    productSlug: "borsello-porta-telefono-cocco",
    authorEmail: "elena.ferrari@email.it",
    authorName: "Elena Ferrari",
    rating: 4,
    title: "Pratico e originale",
    content:
      "La finitura stampata cocco è bellissima e particolare. Perfetto per il telefono, comodo da portare a tracolla. Lo adoro!",
  },
];

// ─── Seed Execution ─────────────────────────────────────────────────────────

async function cleanExistingData(): Promise<void> {
  console.log("🧹 Cleaning existing data...");

  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  console.log("   ✅ Cleaned");
}

async function seedCategories(): Promise<Map<string, string>> {
  console.log("📦 Seeding categories...");
  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        parentId: cat.parentId ? categoryMap.get(cat.parentId) ?? null : null,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        parentId: cat.parentId
          ? categoryMap.get(cat.parentId) ?? null
          : null,
      },
    });
    categoryMap.set(cat.slug, created.id);
  }

  console.log(`   ✅ ${categoryMap.size} categories created`);
  return categoryMap;
}

async function seedProducts(categoryMap: Map<string, string>): Promise<number> {
  console.log("📦 Seeding products...");
  let count = 0;

  for (const prod of products) {
    const categoryId = categoryMap.get(prod.categorySlug) ?? null;

    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        shortDescription: prod.shortDescription,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        sku: prod.sku,
        isActive: prod.isActive,
        isFeatured: prod.isFeatured,
        stock: prod.stock,
        materials: prod.materials,
        categoryId,
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        shortDescription: prod.shortDescription,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        sku: prod.sku,
        isActive: prod.isActive,
        isFeatured: prod.isFeatured,
        stock: prod.stock,
        materials: prod.materials,
        categoryId,
        images: {
          create: prod.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder,
          })),
        },
        variants: {
          create: prod.variants.map((v) => ({
            name: v.name,
            color: v.color,
            size: v.size,
            price: v.price,
            stock: v.stock,
            sortOrder: v.sortOrder,
          })),
        },
      },
    });
    count++;
  }

  console.log(`   ✅ ${count} products created`);
  return count;
}

async function seedReviews(): Promise<number> {
  console.log("📦 Seeding reviews...");
  let count = 0;

  for (const rev of reviews) {
    const product = await prisma.product.findUnique({
      where: { slug: rev.productSlug },
    });
    if (!product) continue;

    let user = await prisma.authUser.findUnique({
      where: { email: rev.authorEmail },
    });
    if (!user) {
      const pwHash = await hashPassword("ReviewUser123!");
      user = await prisma.authUser.create({
        data: {
          email: rev.authorEmail,
          name: rev.authorName,
          passwordHash: pwHash,
          emailVerified: true,
        },
      });
    }

    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: rev.rating,
        title: rev.title,
        content: rev.content,
        isApproved: true,
      },
    });
    count++;
  }

  console.log(`   ✅ ${count} reviews created`);
  return count;
}

async function seedDiscountCodes(): Promise<number> {
  console.log("📦 Seeding discount codes...");
  let count = 0;

  for (const dc of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: dc.code },
      update: {},
      create: {
        code: dc.code,
        type: dc.type,
        value: dc.value,
        minOrder: dc.minOrder,
        maxUses: dc.maxUses,
        startsAt: dc.startsAt,
        expiresAt: dc.expiresAt,
      },
    });
    count++;
  }

  console.log(`   ✅ ${count} discount codes created`);
  return count;
}

async function seedAdminUser(): Promise<void> {
  console.log("👤 Seeding admin user...");

  const ADMIN_EMAIL = "admin@calzoleriaprevenzano.it";
  const ADMIN_PASSWORD = "Admin123!";
  const ADMIN_NAME = "Nunzio Prevenzano";

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const existing = await prisma.authUser.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!existing) {
    await prisma.authUser.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        passwordHash,
        role: "admin",
        emailVerified: true,
      },
    });
    console.log(`   ✅ Admin user created (${ADMIN_EMAIL})`);
  } else {
    await prisma.authUser.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash, name: ADMIN_NAME, role: "admin", emailVerified: true },
    });
    console.log(`   ✅ Admin user updated (${ADMIN_EMAIL})`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seed — Calzoleria Prevenzano");
  console.log("=".repeat(55));

  await cleanExistingData();
  const categoryMap = await seedCategories();
  const productCount = await seedProducts(categoryMap);
  await seedReviews();
  await seedDiscountCodes();
  await seedAdminUser();

  console.log("=".repeat(55));
  console.log("✅ Seed complete");
  console.log(`   Categories: ${categoryMap.size}`);
  console.log(`   Products: ${productCount}`);
  console.log(
    `   Total images: ${products.reduce((sum, p) => sum + p.images.length, 0)}`,
  );
  console.log(
    `   Total variants: ${products.reduce((sum, p) => sum + p.variants.length, 0)}`,
  );
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
