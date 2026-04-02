// ─── Calzoleria Prevenzano — Database Seed ─────────────────────────────────
// ⛔ Admin passwords are hashed with scrypt (same as auth.server.ts).
//   To generate a new hash: run the one-liner in the script below.
// ───────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@calzoleriaprevenzano.it";

// Scrypt hash of "Admin123!@#" — generated via: node -e "const {randomBytes,scrypt}=require('crypto');const{promisify}=require('util');(async()=>{const s=randomBytes(16).toString('hex');const k=(await promisify(scrypt)('Admin123!@#',Buffer.from(s,'hex'),64)).toString('hex');console.log(s+':'+k)})()"
const ADMIN_PASSWORD_HASH =
  "f1fbf1c89327d02170861d7b9f666bc7:4bc45af5dfdae11935d31b7a5cd9ddce8294b2537a50c2baa319eb19f9959066f17185e0745c15fdd6f4d660d187dee8324856dd934a759c9b3538db74b1124a";

// ─── Seed Data Types ─────────────────────────────────────────────────────

interface CategorySeed {
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  parentId: string | null;
}

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
  }>;
}

// ─── Categories ──────────────────────────────────────────────────────────

const categories: CategorySeed[] = [
  {
    name: "Sandali Artigianali",
    slug: "sandali-artigianali",
    description:
      "La nostra collezione di sandali fatti a mano, realizzati con pellami pregiati italiani e maestria artigianale tramandata da generazioni.",
    sortOrder: 1,
    parentId: null,
  },
  {
    name: "Sandali Donna",
    slug: "sandali-donna",
    description: "Sandali artigianali per donna, eleganti e confortevoli.",
    sortOrder: 1,
    parentId: "sandali-artigianali",
  },
  {
    name: "Sandali Uomo",
    slug: "sandali-uomo",
    description: "Sandali artigianali per uomo, robusti e raffinati.",
    sortOrder: 2,
    parentId: "sandali-artigianali",
  },
  {
    name: "Accessori Calzoleria",
    slug: "accessori-calzoleria",
    description:
      "Prodotti tecnici per la cura e la manutenzione delle vostre calzature preferite.",
    sortOrder: 2,
    parentId: null,
  },
  {
    name: "Pelletteria",
    slug: "pelletteria",
    description:
      "Portafogli, cinture e accessori in pelle artigianale, lavorati a mano con pellami italiani di prima qualità.",
    sortOrder: 3,
    parentId: null,
  },
  {
    name: "Portafogli",
    slug: "portafogli",
    description: "Portafogli in pelle artigianale, disponibili in vari modelli.",
    sortOrder: 1,
    parentId: "pelletteria",
  },
  {
    name: "Cinture",
    slug: "cinture",
    description: "Cinture in pelle artigianale italiane.",
    sortOrder: 2,
    parentId: "pelletteria",
  },
];

// ─── Products ────────────────────────────────────────────────────────────

const products: ProductSeed[] = [
  {
    name: "Sandalo Siciliano in Pelle di Vitello",
    slug: "sandalo-siciliano-pelle-vitello",
    description:
      "Il nostro sandalo iconico, ispirato alla tradizione siciliana. Realizzato interamente a mano in pelle di vitello pieno fiore, conciata al vegetale nel rispetto dell'ambiente. La suola in cuoio lavorato garantisce morbidezza e resistenza nel tempo. Ogni paio è unico, con finiture curate nei minimi dettagli dai nostri maestri artigiani.",
    shortDescription:
      "Sandalo artigianale in pelle di vitello conciata al vegetale, made in Italy.",
    price: 129.0,
    compareAtPrice: 159.0,
    sku: "CP-SSD-001",
    isActive: true,
    isFeatured: true,
    stock: 24,
    materials: "Pelle di vitello pieno fiore, cuoio, fibbia in ottone",
    categorySlug: "sandali-donna",
    images: [
      {
        url: "/images/products/sandalo-siciliano-01.jpg",
        alt: "Sandalo Siciliano vista laterale",
        sortOrder: 1,
      },
      {
        url: "/images/products/sandalo-siciliano-02.jpg",
        alt: "Sandalo Siciliano vista superiore",
        sortOrder: 2,
      },
      {
        url: "/images/products/sandalo-siciliano-03.jpg",
        alt: "Sandalo Siciliano dettaglio cuciture",
        sortOrder: 3,
      },
    ],
    variants: [
      { name: "Nero / 37", color: "Nero", size: "37", price: null, stock: 3 },
      { name: "Nero / 38", color: "Nero", size: "38", price: null, stock: 4 },
      { name: "Nero / 39", color: "Nero", size: "39", price: null, stock: 4 },
      { name: "Nero / 40", color: "Nero", size: "40", price: null, stock: 3 },
      { name: "Marrone / 38", color: "Marrone", size: "38", price: null, stock: 4 },
      { name: "Marrone / 39", color: "Marrone", size: "39", price: null, stock: 3 },
      { name: "Marrone / 40", color: "Marrone", size: "40", price: null, stock: 3 },
    ],
  },
  {
    name: "Sandalo Gladiator Intrecciato",
    slug: "sandalo-gladiator-intrecciato",
    description:
      "Sandalo gladiator con tomaia intrecciata a mano, un capo che unisce design contemporaneo e artigianalità tradizionale. La lavorazione intrecciata richiede ore di pazienza e precisione da parte dei nostri artigiani. La suola in gomma antiscivolo assicura stabilità su ogni superficie.",
    shortDescription:
      "Sandalo gladiator con tomaia intrecciata a mano, suola in gomma.",
    price: 145.0,
    compareAtPrice: null,
    sku: "CP-SGL-002",
    isActive: true,
    isFeatured: true,
    stock: 18,
    materials: "Pelle intrecciata, suola in gomma antiscivolo",
    categorySlug: "sandali-donna",
    images: [
      {
        url: "/images/products/sandalo-gladiator-01.jpg",
        alt: "Sandalo Gladiator vista frontale",
        sortOrder: 1,
      },
      {
        url: "/images/products/sandalo-gladiator-02.jpg",
        alt: "Sandalo Gladiator dettaglio intreccio",
        sortOrder: 2,
      },
    ],
    variants: [
      { name: "Beige / 37", color: "Beige", size: "37", price: null, stock: 3 },
      { name: "Beige / 38", color: "Beige", size: "38", price: null, stock: 3 },
      { name: "Beige / 39", color: "Beige", size: "39", price: null, stock: 3 },
      { name: "Nero / 40", color: "Nero", size: "40", price: null, stock: 3 },
      { name: "Nero / 41", color: "Nero", size: "41", price: null, stock: 3 },
      { name: "Nero / 42", color: "Nero", size: "42", price: null, stock: 3 },
    ],
  },
  {
    name: "Sandalo Floreale con Ricamo",
    slug: "sandalo-floreale-ricamo",
    description:
      "Un sandalo che racconta la storia della tradizione artigianale italiana attraverso il ricamo floreale eseguito a mano. Ogni fiore è cucito singolarmente dalla nostra maestra ricamatrice, rendendo ogni paio un pezzo unico. La pelle morbida si adatta al piede garantendo comfort per tutta la giornata.",
    shortDescription:
      "Sandalo con ricamo floreale eseguito a mano, pezzo unico artigianale.",
    price: 165.0,
    compareAtPrice: 195.0,
    sku: "CP-SFL-003",
    isActive: true,
    isFeatured: false,
    stock: 10,
    materials: "Piele di agnello, ricamo in filo di cotone, suola in cuoio",
    categorySlug: "sandali-donna",
    images: [
      {
        url: "/images/products/sandalo-floreale-01.jpg",
        alt: "Sandalo Floreale vista laterale",
        sortOrder: 1,
      },
    ],
    variants: [
      { name: "Bianco / 37", color: "Bianco", size: "37", price: null, stock: 2 },
      { name: "Bianco / 38", color: "Bianco", size: "38", price: null, stock: 2 },
      { name: "Rosa / 39", color: "Rosa", size: "39", price: null, stock: 3 },
      { name: "Rosa / 40", color: "Rosa", size: "40", price: null, stock: 3 },
    ],
  },
  {
    name: "Sandalo Maschile in Cuoio",
    slug: "sandalo-maschile-cuoio",
    description:
      "Sandalo maschile essenziale e raffinato, realizzato in cuoio toscano selezionato a mano. La lavorazione a strisce incrociate dona un look moderno ma senza tempo. La suola in cuoio con inserto in gomma offre grip e durabilità. Ideale per l'estate italiana con un tocco di eleganza informale.",
    shortDescription:
      "Sandalo maschile in cuoio toscano, lavorazione a strisce incrociate.",
    price: 139.0,
    compareAtPrice: null,
    sku: "CP-SMC-004",
    isActive: true,
    isFeatured: true,
    stock: 15,
    materials: "Cuoio toscano, suola in cuoio con inserto in gomma",
    categorySlug: "sandali-uomo",
    images: [
      {
        url: "/images/products/sandalo-uomo-01.jpg",
        alt: "Sandalo Maschile in Cuoio vista laterale",
        sortOrder: 1,
      },
      {
        url: "/images/products/sandalo-uomo-02.jpg",
        alt: "Sandalo Maschile dettaglio suola",
        sortOrder: 2,
      },
    ],
    variants: [
      { name: "Marrone Testa / 41", color: "Marrone testa di moro", size: "41", price: null, stock: 3 },
      { name: "Marrone Testa / 42", color: "Marrone testa di moro", size: "42", price: null, stock: 3 },
      { name: "Marrone Testa / 43", color: "Marrone testa di moro", size: "43", price: null, stock: 3 },
      { name: "Marrone Testa / 44", color: "Marrone testa di moro", size: "44", price: null, stock: 3 },
      { name: "Nero / 42", color: "Nero", size: "42", price: null, stock: 3 },
    ],
  },
  {
    name: "Sandalo da Barca in Pelle",
    slug: "sandalo-barca-pelle",
    description:
      "Rivisitazione artigianale del classico sandalo da barca, realizzato in morbida pelle nabuk. I lacci sono intrecciati a mano e le finiture sartoriali distinguono questo modello dalle produzioni industriali. Perfetto con chino o bermuda per un look estivo sofisticato.",
    shortDescription:
      "Sandalo da barca in pelle nabuk, lacci intrecciati a mano.",
    price: 119.0,
    compareAtPrice: 149.0,
    sku: "CP-SBC-005",
    isActive: true,
    isFeatured: false,
    stock: 12,
    materials: "Pelle nabuk, lacci in cotone cerato, suola in cuoio",
    categorySlug: "sandali-uomo",
    images: [
      {
        url: "/images/products/sandalo-barca-01.jpg",
        alt: "Sandalo da Barca vista frontale",
        sortOrder: 1,
      },
    ],
    variants: [
      { name: "Blu Marino / 41", color: "Blu marino", size: "41", price: null, stock: 2 },
      { name: "Blu Marino / 42", color: "Blu marino", size: "42", price: null, stock: 2 },
      { name: "Blu Marino / 43", color: "Blu marino", size: "43", price: null, stock: 2 },
      { name: "Beige / 42", color: "Beige", size: "42", price: null, stock: 3 },
      { name: "Beige / 44", color: "Beige", size: "44", price: null, stock: 3 },
    ],
  },
  {
    name: "Kit Cura Calzature Professionale",
    slug: "kit-cura-calzature",
    description:
      "Il kit completo per la cura delle vostre calzature artigianali. Contiene crema idratante in cera d'api, lucido in pasta, spazzola in crine di cavallo e panno in microfibra. Prodotti selezionati dai nostri artigiani per mantenere la bellezza del cuoio nel tempo.",
    shortDescription:
      "Kit completo per la cura delle calzature in pelle e cuoio.",
    price: 39.9,
    compareAtPrice: null,
    sku: "CP-KCC-006",
    isActive: true,
    isFeatured: false,
    stock: 30,
    materials: null,
    categorySlug: "accessori-calzoleria",
    images: [
      {
        url: "/images/products/kit-cura-01.jpg",
        alt: "Kit Cura Calzature Professionale",
        sortOrder: 1,
      },
    ],
    variants: [],
  },
  {
    name: "Formine per Mantenere la Forma",
    slug: "formine-cedro",
    description:
      "Formine in legno di cedro profumato, essenziali per mantenere la forma delle vostre calzature. Il cedro assorbe l'umidità e rilascia un profumo naturale che combatte i cattivi odori. Disponibili in diverse taglie per una vestibilità perfetta.",
    shortDescription:
      "Formine in legno di cedro per mantenere la forma delle calzature.",
    price: 24.9,
    compareAtPrice: null,
    sku: "CP-FCD-007",
    isActive: true,
    isFeatured: false,
    stock: 50,
    materials: "Legno di cedro naturale",
    categorySlug: "accessori-calzoleria",
    images: [
      {
        url: "/images/products/formine-cedro-01.jpg",
        alt: "Formine in legno di cedro",
        sortOrder: 1,
      },
    ],
    variants: [
      { name: "Taglia S (38-39)", color: "Naturale", size: "S", price: null, stock: 15 },
      { name: "Taglia M (40-41)", color: "Naturale", size: "M", price: null, stock: 15 },
      { name: "Taglia L (42-44)", color: "Naturale", size: "L", price: null, stock: 20 },
    ],
  },
  {
    name: "Portafoglio Classico in Pelle",
    slug: "portafoglio-classico-pelle",
    description:
      "Portafoglio classico realizzato in vitello pieno fiore con cuciture a mano in filo di lino cerato. Composto da 6 portacarte, 2 tasche portadocumenti e 1 tasca portamonete con chiusura a bottone. La pelle si patina naturalmente con l'uso, acquisendo carattere e personalità nel tempo.",
    shortDescription:
      "Portafoglio in vitello pieno fiore con cuciture a mano.",
    price: 89.0,
    compareAtPrice: null,
    sku: "CP-PCP-008",
    isActive: true,
    isFeatured: true,
    stock: 20,
    materials: "Pelle di vitello pieno fiore, filo di lino cerato",
    categorySlug: "portafogli",
    images: [
      {
        url: "/images/products/portafoglio-classico-01.jpg",
        alt: "Portafoglio Classico aperto",
        sortOrder: 1,
      },
      {
        url: "/images/products/portafoglio-classico-02.jpg",
        alt: "Portafoglio Classico chiuso",
        sortOrder: 2,
      },
    ],
    variants: [
      { name: "Marrone", color: "Marrone", size: null, price: null, stock: 8 },
      { name: "Nero", color: "Nero", size: null, price: null, stock: 7 },
      { name: "Cognac", color: "Cognac", size: null, price: null, stock: 5 },
    ],
  },
  {
    name: "Portacarte Sottile in Pelle",
    slug: "portacarte-sottile-pelle",
    description:
      "Portacarte minimalista e sottile, perfetto per chi preferisce la leggerezza senza rinunciare all'eleganza. Realizzato in un unico pezzo di pelle di vitello con bordi verniciati a mano. 4 tasche per carte e 1 scomparto centrale per banconote.",
    shortDescription:
      "Portacarte sottile in vitello con bordi verniciati a mano.",
    price: 59.0,
    compareAtPrice: 69.0,
    sku: "CP-PSP-009",
    isActive: true,
    isFeatured: false,
    stock: 25,
    materials: "Pelle di vitello, bordi verniciati a mano",
    categorySlug: "portafogli",
    images: [
      {
        url: "/images/products/portacarte-sottile-01.jpg",
        alt: "Portacarte Sottile vista frontale",
        sortOrder: 1,
      },
    ],
    variants: [
      { name: "Nero", color: "Nero", size: null, price: null, stock: 8 },
      { name: "Marrone", color: "Marrone", size: null, price: null, stock: 8 },
      { name: "Blu", color: "Blu", size: null, price: null, stock: 9 },
    ],
  },
  {
    name: "Cintura in Pelle Intrecciata",
    slug: "cintura-pelle-intrecciata",
    description:
      "Cintura in pelle intrecciata a mano dai nostri artigiani. La fibbia in ottone satinato è forgiata da un maestro artigiano locale. La lavorazione intrecciata conferisce elasticità e comfort, adattandosi naturalmente al girovita. Un accessorio versatile che eleva qualsiasi outfit.",
    shortDescription:
      "Cintura in pelle intrecciata a mano con fibbia in ottone.",
    price: 79.0,
    compareAtPrice: null,
    sku: "CP-CPI-010",
    isActive: true,
    isFeatured: true,
    stock: 18,
    materials: "Pelle di vitello, fibbia in ottone satinato",
    categorySlug: "cinture",
    images: [
      {
        url: "/images/products/cintura-intrecciata-01.jpg",
        alt: "Cintura Intrecciata con fibbia",
        sortOrder: 1,
      },
    ],
    variants: [
      { name: "Marrone / 90cm", color: "Marrone", size: "90", price: null, stock: 4 },
      { name: "Marrone / 100cm", color: "Marrone", size: "100", price: null, stock: 4 },
      { name: "Nero / 95cm", color: "Nero", size: "95", price: null, stock: 5 },
      { name: "Nero / 105cm", color: "Nero", size: "105", price: null, stock: 5 },
    ],
  },
  {
    name: "Cintura Classica in Cuoio",
    slug: "cintura-classica-cuoio",
    description:
      "Cintura classica in cuoio toscano con bordi arrotondati e cuciture a contrasto. La fibbia con logo inciso è un dettaglio di eleganza discreta. Il cuoio, con il passare del tempo, sviluppa una patina dorata che rende ogni cintura unica.",
    shortDescription:
      "Cintura classica in cuoio toscano con cuciture a contrasto.",
    price: 69.0,
    compareAtPrice: null,
    sku: "CP-CCC-011",
    isActive: true,
    isFeatured: false,
    stock: 22,
    materials: "Cuoio toscano, fibbia in acciaio satinato",
    categorySlug: "cinture",
    images: [
      {
        url: "/images/products/cintura-classica-01.jpg",
        alt: "Cintura Classica in Cuoio",
        sortOrder: 1,
      },
    ],
    variants: [
      { name: "Marrone / 90cm", color: "Marrone", size: "90", price: null, stock: 5 },
      { name: "Marrone / 100cm", color: "Marrone", size: "100", price: null, stock: 5 },
      { name: "Nero / 95cm", color: "Nero", size: "95", price: null, stock: 6 },
      { name: "Nero / 105cm", color: "Nero", size: "105", price: null, stock: 6 },
    ],
  },
];

// ─── Reviews ─────────────────────────────────────────────────────────────

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
    productSlug: "sandalo-siciliano-pelle-vitello",
    authorEmail: "maria.rossi@email.it",
    authorName: "Maria Rossi",
    rating: 5,
    title: "Comodi e bellissimi!",
    content:
      "Ho comprato questi sandali per le vacanze estive e sono rimasta incantata. La pelle è morbidissima, sembrano fatti su misura. La qualità si sente appena li indossi. Li consiglio vivamente a chi cerca un prodotto artigianale italiano di vera qualità.",
  },
  {
    productSlug: "sandalo-siciliano-pelle-vitello",
    authorEmail: "giulia.bianchi@email.it",
    authorName: "Giulia Bianchi",
    rating: 5,
    title: "Qualità artigianale eccellente",
    content:
      "Finalmente un sandalo che unisce stile e comfort. Le cuciture sono perfette e la pelle ha un profumo meraviglioso. Ho ricevuto tantissimi complimenti!",
  },
  {
    productSlug: "sandalo-gladiator-intrecciato",
    authorEmail: "francesca.verdi@email.it",
    authorName: "Francesca Verdi",
    rating: 4,
    title: "Stile unico, un po' rigidi all'inizio",
    content:
      "Il design è fantastico, l'intreccio è fatto benissimo. All'inizio erano un po' rigidi ma dopo qualche giorno di utilizzo si sono ammorbiditi perfettamente. Li adoro!",
  },
  {
    productSlug: "sandalo-maschile-cuoio",
    authorEmail: "luca.moretti@email.it",
    authorName: "Luca Moretti",
    rating: 5,
    title: "Il miglior sandalo che abbia mai avuto",
    content:
      "Morbido, elegante, resistente. Il cuoio toscano fa la differenza. Ho camminato per ore in città senza alcun fastidio. Un prodotto che vale ogni centesimo speso.",
  },
  {
    productSlug: "portafoglio-classico-pelle",
    authorEmail: "alessandro.conti@email.it",
    authorName: "Alessandro Conti",
    rating: 5,
    title: "Lavorazione impeccabile",
    content:
      "Le cuciture a mano sono evidenti e curate. La pelle è spessa ma morbida, si sente che è un prodotto di qualità. Lo sto usando da mesi e si sta patinando magnificamente.",
  },
  {
    productSlug: "cintura-pelle-intrecciata",
    authorEmail: "elena.ferrari@email.it",
    authorName: "Elena Ferrari",
    rating: 4,
    title: "Bella e versatile",
    content:
      "Una cintura che si abbina a tutto. L'intreccio è elegante e la fibbia in ottone dà quel tocco di ricercatezza. L'ho regalata al mio ragazzo e ne è entusiasta.",
  },
];

// ─── Discount Codes ──────────────────────────────────────────────────────

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

// ─── Seed Execution ──────────────────────────────────────────────────────

async function seedCategories(): Promise<Map<string, string>> {
  console.log("📦 Seeding categories...");
  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        parentId: cat.parentId ? (categoryMap.get(cat.parentId) ?? null) : null,
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
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        stock: prod.stock,
        isActive: prod.isActive,
        isFeatured: prod.isFeatured,
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
    const product = await prisma.product.findUnique({ where: { slug: rev.productSlug } });
    if (!product) continue;

    // Find or create a user for the review
    let user = await prisma.authUser.findUnique({ where: { email: rev.authorEmail } });
    if (!user) {
      user = await prisma.authUser.create({
        data: {
          email: rev.authorEmail,
          name: rev.authorName,
          passwordHash: ADMIN_PASSWORD_HASH,
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
  console.log("👤 Seeding admin users...");

  const existingAdmin = await prisma.authUser.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    await prisma.authUser.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Amministratore",
        passwordHash: ADMIN_PASSWORD_HASH,
        role: "admin",
        emailVerified: true,
      },
    });
    console.log(`   ✅ Admin user created (${ADMIN_EMAIL})`);
  } else {
    await prisma.authUser.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash: ADMIN_PASSWORD_HASH },
    });
    console.log(`   ✅ Admin user updated (${ADMIN_EMAIL})`);
  }

  // Second admin: pasquale@calzoleriaprevenzano.it
  const SECOND_ADMIN_EMAIL = "pasquale@calzoleriaprevenzano.it";
  const existingSecond = await prisma.authUser.findUnique({
    where: { email: SECOND_ADMIN_EMAIL },
  });

  if (!existingSecond) {
    await prisma.authUser.create({
      data: {
        email: SECOND_ADMIN_EMAIL,
        name: "Pasquale",
        passwordHash: ADMIN_PASSWORD_HASH,
        role: "admin",
        emailVerified: true,
      },
    });
    console.log(`   ✅ Second admin created (${SECOND_ADMIN_EMAIL})`);
  } else {
    console.log(`   ✅ Second admin already exists (${SECOND_ADMIN_EMAIL})`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seed — Calzoleria Prevenzano");
  console.log("=".repeat(55));

  const categoryMap = await seedCategories();
  const productCount = await seedProducts(categoryMap);
  await seedReviews();
  await seedDiscountCodes();
  await seedAdminUser();

  console.log("=".repeat(55));
  console.log("✅ Seed complete");
  console.log(`   Categories: ${categoryMap.size}`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Total images: ${products.reduce((sum, p) => sum + p.images.length, 0)}`);
  console.log(`   Total variants: ${products.reduce((sum, p) => sum + p.variants.length, 0)}`);
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
