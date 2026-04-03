/**
 * scrape-wcpa-variants.ts v2
 * 
 * Parser robusto per WCPA — estrae TUTTI i campi form con logica condizionale
 * e tutte le immagini thumbnail/full-size per ogni opzione colore.
 * 
 * Output: site-output/wcpa-variants.json
 */

import * as fs from "fs";
import * as https from "https";

// ─── Types ────────────────────────────────────────────────────────

interface WcpaOption {
  value: string;
  label: string;
  priceModifier: number;
  thumbnailUrl: string;
  imageUrl: string;
  color?: string;
}

interface WcpaColorGroup {
  groupName: string;
  showWhenParentValue: string;
  options: WcpaOption[];
}

interface WcpaField {
  id: string;
  name: string;
  type: "radio" | "image-group" | "select";
  required: boolean;
  options: WcpaOption[];
  colorGroups?: WcpaColorGroup[];
}

interface WcpaProductData {
  slug: string;
  name: string;
  originalUrl: string;
  hasWcpa: boolean;
  fields: WcpaField[];
  scrapedAt: string;
}

// ─── HTTP ──────────────────────────────────────────────────────────

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject).setTimeout(20000, function() { this.destroy(); reject(new Error("Timeout")); });
  });
}

// ─── Helpers ───────────────────────────────────────────────────────

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "'").replace(/&#8211;/g, "–");
}

function guessColorHex(label: string): string | undefined {
  const l = label.toLowerCase().trim();
  const map: Record<string, string> = {
    "nero": "#1a1a1a", "bianco": "#f5f0eb", "rosso": "#8b2020", "rosso scuro": "#6b1515",
    "blu": "#1e3a5f", "blu elettrico": "#0055aa", "blu navy": "#1a1a4e", "azzurro": "#4da6ff",
    "beige": "#d4b896", "marrone": "#5c3a1e", "verde": "#2d4a2d", "verde acqua": "#2a7a6e",
    "arancione": "#c4652a", "arancio": "#c4652a", "viola": "#6a1b6d", "lilla": "#b57edc",
    "rosa": "#e88da0", "fucsia": "#c2185b", "giallo": "#e8c840", "turchese": "#30d5c8",
    "celeste": "#87ceeb", "bordeaux": "#5c0120", "vinaccio": "#6b2d3f", "petrolio": "#006666",
    "corallo": "#ff6f61", "cammello": "#c4a882", "cuoio": "#a0724a",
    "oro giallo": "#d4a843", "oro rosa": "#b76e79", "oro chiaro": "#e0c97f",
    "argento": "#c0c0c0", "platino": "#e5e4e2", "bronzo": "#cd7f32",
    "carta da zucchero": "#f0e6d3",
  };
  if (map[l]) return map[l];
  for (const [key, hex] of Object.entries(map)) {
    if (l.includes(key)) return hex;
  }
  return undefined;
}

// ─── WCPA Parser v2 ────────────────────────────────────────────────
// Instead of trying to find matching divs (fragile), extract individual
// elements by their known WCPA class patterns.

function parseWcpaForm(html: string): WcpaField[] {
  // Step 0: Find the WCPA form container — try wcpa_form_outer first (more reliable),
  // fall back to <form class="cart"> for older setups
  let formHtml = "";

  const outerStart = html.indexOf('wcpa_form_outer');
  if (outerStart >= 0) {
    // Find the containing <div class="... wcpa_form_outer ..."> and extract to its </div>
    // Go back to find the opening <div or <section
    const searchStart = Math.max(0, outerStart - 200);
    const beforeOuter = html.slice(searchStart, outerStart + 50);
    const divMatch = beforeOuter.match(/<(div|section)[^>]*\sclass="[^"]*wcpa_form_outer[^"]*"/);
    if (divMatch) {
      const tagStart = searchStart + (divMatch.index ?? 0);
      // Find matching close tag
      let depth = 0;
      const openTag = divMatch[1];
      const closeTag = `</${openTag}>`;
      for (let i = tagStart; i < html.length; i++) {
        if (html.slice(i, i + openTag.length + 1) === `<${openTag}`) depth++;
        if (html.slice(i, i + closeTag.length) === closeTag) { depth--; if (depth === 0) { formHtml = html.slice(tagStart, i + closeTag.length); break; } }
      }
    }
  }

  // Fallback: try <form class="cart">
  if (!formHtml) {
    const cartFormStart = html.indexOf('<form class="cart"');
    if (cartFormStart >= 0) {
      let depth = 0;
      let formEnd = cartFormStart;
      for (let i = cartFormStart; i < html.length; i++) {
        if (html.slice(i, i + 5) === "<form") depth++;
        if (html.slice(i, i + 7) === "</form>") { depth--; if (depth === 0) { formEnd = i + 7; break; } }
      }
      formHtml = html.slice(cartFormStart, formEnd);
    }
  }

  if (!formHtml) return [];

  // Step 1: Extract all wcpa_form_item blocks with their IDs, types, labels, and data attributes
  const items: Array<{
    id: string;
    type: string;
    label: string;
    relatedIds: string[];
    rules: { cl_field?: string; cl_val?: { value: string } } | null;
  }> = [];

  const itemTagRegex = /<div\s+class="([^"]*wcpa_form_item[^"]*)"\s+([^>]*)>/g;
  let m: RegExpExecArray | null;

  while ((m = itemTagRegex.exec(formHtml)) !== null) {
    const classes = m[1];
    const attrs = m[2];

    const idMatch = attrs.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const typeMatch = classes.match(/wcpa_type_(\S+)/);
    const type = typeMatch ? typeMatch[1] : "";

    // Extract label — find it near the opening tag
    const searchArea = formHtml.slice(m.index, m.index + 500);
    const labelMatch = searchArea.match(/<label[^>]*>([^<]+)<\/label>/);
    const label = labelMatch ? labelMatch[1].replace(/\s*\*\s*$/, "").trim() : id;

    // data-related: parent field listing child IDs
    const relatedMatch = attrs.match(/data-related='([^']+)'/);
    let relatedIds: string[] = [];
    if (relatedMatch) {
      try { relatedIds = JSON.parse(decodeHtmlEntities(relatedMatch[1])); } catch { /* skip */ }
    }

    // data-rules: conditional visibility
    const rulesMatch = attrs.match(/data-rules='([^']+)'/);
    let rules: { cl_field?: string; cl_val?: { value: string } } | null = null;
    if (rulesMatch) {
      try { rules = extractConditionalRule(JSON.parse(decodeHtmlEntities(rulesMatch[1]))); } catch { /* skip */ }
    }

    items.push({ id, type, label, relatedIds, rules });
  }

  // Step 2: For each item, extract its content from the form HTML
  // Strategy: content goes from this item's opening tag to the NEXT item's opening tag (or form end)
  const fieldContents = new Map<string, string>();
  for (let i = 0; i < items.length; i++) {
    // Find this item's opening tag position in formHtml
    const thisItemPos = formHtml.indexOf('id="' + items[i].id + '"');
    if (thisItemPos < 0) continue;
    const contentStart = formHtml.indexOf(">", thisItemPos) + 1;

    // Find next item's opening tag position, or end of form
    let contentEnd = formHtml.length;
    if (i + 1 < items.length) {
      const nextItemPos = formHtml.indexOf('id="' + items[i + 1].id + '"', contentStart);
      if (nextItemPos > 0) contentEnd = nextItemPos;
    }

    fieldContents.set(items[i].id, formHtml.slice(contentStart, contentEnd));
  }

  // Step 2: Parse each item based on its type
  const fields: WcpaField[] = [];
  const fieldHtmlMap = fieldContents;

  for (const item of items) {
    const rawHtml = fieldHtmlMap.get(item.id) ?? "";
    if (item.type === "radio-group") {
      fields.push(parseRadioField({ ...item, hasRelation: item.relatedIds.length > 0, rawHtml }));
    } else if (item.type === "image-group") {
      fields.push(parseImageGroupField({ ...item, hasRelation: item.relatedIds.length > 0, rawHtml }));
    } else if (item.type === "select" || item.type === "select-box") {
      fields.push(parseSelectField({ ...item, hasRelation: item.relatedIds.length > 0, rawHtml }));
    }
  }

  // Step 3: Link conditional children to parent radio fields
  // A child image-group has rules.cl_val.value matching a parent radio option's value
  // A parent radio has data-related listing the IDs of its children
  for (const field of fields) {
    if (field.type === "radio") {
      const parentItem = items.find(it => it.id === field.id);
      if (parentItem && parentItem.relatedIds.length > 0) {
        field.colorGroups = [];
        for (const childId of parentItem.relatedIds) {
          const childField = fields.find(f => f.id === childId);
          if (childField && childField.type === "image-group" && childField._showWhenParentValue) {
            field.colorGroups.push({
              groupName: childField.name,
              showWhenParentValue: childField._showWhenParentValue,
              options: childField.options,
            });
          }
        }
      }
    }
  }

  // Step 4: Remove child image-groups that have been merged into parents
  const childIdsToRemove = new Set<string>();
  for (const field of fields) {
    if (field.type === "radio" && field.colorGroups) {
      for (const group of field.colorGroups) {
        const childField = fields.find(f => f.name === group.groupName);
        if (childField) childIdsToRemove.add(childField.id);
      }
    }
  }

  return fields.filter(f => !childIdsToRemove.has(f.id)).map(f => {
    // Clean up internal fields
    const cleaned = { ...f } as WcpaField & { _showWhenParentValue?: string };
    delete cleaned._showWhenParentValue;
    return cleaned;
  });
}

interface ParsedItem {
  id: string;
  type: string;
  label: string;
  hasRelation: boolean;
  relatedIds: string[];
  rules: { cl_field?: string; cl_val?: { value: string } } | null;
  rawHtml: string;
}

function extractConditionalRule(rules: Record<string, unknown>): { cl_field?: string; cl_val?: { value: string } } | null {
  if (rules.cl_field && rules.cl_val) {
    return { cl_field: String(rules.cl_field), cl_val: rules.cl_val as { value: string } };
  }
  if (Array.isArray(rules.rules)) {
    for (const r of rules.rules) {
      const found = extractConditionalRule(r as Record<string, unknown>);
      if (found) return found;
    }
  }
  if (typeof rules.rules === "object" && rules.rules !== null && !Array.isArray(rules.rules)) {
    return extractConditionalRule(rules.rules as Record<string, unknown>);
  }
  return null;
}

function parseRadioField(item: ParsedItem): WcpaField & { _showWhenParentValue?: string } {
  const options: WcpaOption[] = [];
  // WCPA radio HTML pattern: <input name="..." id="..." value="classica" type="radio" ...> ... <label for="...">...Classica</label>
  // The value can come before or after type="radio"
  const radioRegex = /<input[^>]*value="([^"]+)"[^>]*type="radio"[^>]*>[\s\S]*?<label[^>]*>(?:<[^>]*>)*([^<]+)/g;
  const radioRegex2 = /<input[^>]*type="radio"[^>]*value="([^"]+)"[^>]*>[\s\S]*?<label[^>]*>(?:<[^>]*>)*([^<]+)/g;
  
  const seen = new Set<string>();
  const tryParse = (regex: RegExp) => {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(item.rawHtml)) !== null) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        options.push({ value: m[1], label: m[2].trim(), priceModifier: 0, thumbnailUrl: "", imageUrl: "" });
      }
    }
  };
  
  tryParse(radioRegex);
  if (options.length === 0) tryParse(radioRegex2);
  
  return { id: item.id, name: item.label, type: "radio", required: true, options };
}

function parseImageGroupField(item: ParsedItem): WcpaField & { _showWhenParentValue?: string } {
  const options: WcpaOption[] = [];
  const raw = item.rawHtml;

  // Strategy: find all <p class="wcpa_image_desc">Label</p> entries
  // Each is preceded by an <img src="thumb" data-src="full"> in the same wcpa_image block
  const descRegex = /class="wcpa_image_desc"[^>]*>\s*([^<]+)/g;
  const imgRegex = /<img\s+src="([^"]+)"[^>]*data-src="([^"]+)"/g;
  const valRegex = /value="([^"]+)"[^>]*type="radio"/g;

  // Extract all labels
  const labels: Array<{ label: string; pos: number }> = [];
  let dm: RegExpExecArray | null;
  while ((dm = descRegex.exec(raw)) !== null) {
    labels.push({ label: dm[1].trim(), pos: dm.index });
  }

  // Extract all img src/data-src pairs BEFORE each label position
  const imgs: Array<{ thumb: string; full: string; pos: number }> = [];
  let im: RegExpExecArray | null;
  while ((im = imgRegex.exec(raw)) !== null) {
    imgs.push({ thumb: im[1], full: im[2], pos: im.index });
  }

  // Extract all radio values  
  const vals: Array<{ value: string; pos: number }> = [];
  let vm: RegExpExecArray | null;
  while ((vm = valRegex.exec(raw)) !== null) {
    vals.push({ value: vm[1], pos: vm.index });
  }

  // Match each label to the nearest img and value that come BEFORE it
  for (let i = 0; i < labels.length; i++) {
    const labelPos = labels[i].pos;
    const img = [...imgs].reverse().find(img => img.pos < labelPos);
    const val = [...vals].reverse().find(v => v.pos < labelPos);
    if (img) {
      options.push({
        value: val ? val.value : String(i),
        label: labels[i].label,
        priceModifier: 0,
        thumbnailUrl: img.thumb,
        imageUrl: img.full,
        color: guessColorHex(labels[i].label),
      });
    }
  }

  // FALLBACK: If no wcpa_image_desc found, try extracting from <label> tags (used by Tacco, Gioiello, etc.)
  if (options.length === 0) {
    // Match <label for="id">text<span ...>price</span></label> — strip inner HTML from label text
    const labelTagRegex = /<label[^>]*>([\s\S]*?)<\/label>/g;
    let lm: RegExpExecArray | null;
    while ((lm = labelTagRegex.exec(raw)) !== null) {
      const innerHtml = lm[1];
      // Strip any inner HTML tags to get clean label text
      const cleanLabel = innerHtml.replace(/<[^>]+>/g, "").trim();
      // Skip short/empty labels, duplicates, and non-useful labels
      if (cleanLabel.length < 2 || cleanLabel.length > 60) continue;
      // Skip labels that look like field labels (contain asterisk or are too generic)
      if (cleanLabel === item.label || cleanLabel.includes("*")) continue;
      
      const img = [...imgs].reverse().find(img => img.pos < lm.index);
      const val = [...vals].reverse().find(v => v.pos < lm.index);
      if (img) {
        // Extract price modifier from wcpa_opt_price span
        const priceMatch = innerHtml.match(/wcpa_opt_price[^>]*>\s*\(?([0-9,]+)[€EUR]\)?/i);
        const priceModifier = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : 0;
        
        options.push({
          value: val ? val.value : String(options.length),
          label: cleanLabel,
          priceModifier,
          thumbnailUrl: img.thumb,
          imageUrl: img.full,
        });
      }
    }
  }

  const result: WcpaField & { _showWhenParentValue?: string } = {
    id: item.id,
    name: item.label,
    type: "image-group",
    required: item.rawHtml.includes("wcpa_required"),
    options,
  };

  // Attach conditional rule
  if (item.rules?.cl_val?.value) {
    result._showWhenParentValue = item.rules.cl_val.value;
  }

  return result;
}

function parseSelectField(item: ParsedItem): WcpaField {
  const options: WcpaOption[] = [];
  const optRegex = /<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g;
  let m: RegExpExecArray | null;
  while ((m = optRegex.exec(item.rawHtml)) !== null) {
    if (m[1]) {
      options.push({
        value: m[1],
        label: m[2].trim(),
        priceModifier: 0,
        thumbnailUrl: "",
        imageUrl: "",
      });
    }
  }
  return { id: item.id, name: item.label, type: "select", required: true, options };
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  const productsData = JSON.parse(fs.readFileSync("site-output/scraped-products.json", "utf-8"));
  const products = productsData.products as Array<{ name: string; slug: string; originalUrl: string }>;

  console.log(`\n🔍 Scraping WCPA variants for ${products.length} products...\n`);

  const results: WcpaProductData[] = [];
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const short = p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name;

    try {
      const html = await fetchUrl(p.originalUrl);
      const fields = parseWcpaForm(html);
      const hasWcpa = fields.length > 0 && fields.some(f => f.type !== "select" || f.options.length > 1);

      results.push({ slug: p.slug, name: p.name, originalUrl: p.originalUrl, hasWcpa, fields, scrapedAt: new Date().toISOString() });

      if (hasWcpa) {
        const totalOpts = fields.reduce((s, f) => s + f.options.length + (f.colorGroups?.reduce((cs, g) => cs + g.options.length, 0) ?? 0), 0);
        const conditionalGroups = fields.reduce((s, f) => s + (f.colorGroups?.length ?? 0), 0);
        console.log(`  [${String(i+1).padStart(3)}] ✅ ${short} → ${fields.length} fields, ${totalOpts} opts, ${conditionalGroups} conditional groups`);
      } else if ((i + 1) % 20 === 0 || i < 2) {
        console.log(`  [${String(i+1).padStart(3)}] ⬜ ${short} (no WCPA)`);
      }

      await new Promise(r => setTimeout(r, 350 + Math.random() * 250));
    } catch (err) {
      errors++;
      console.log(`  [${String(i+1).padStart(3)}] ❌ ${short}: ${err instanceof Error ? err.message : "Error"}`);
      results.push({ slug: p.slug, name: p.name, originalUrl: p.originalUrl, hasWcpa: false, fields: [], scrapedAt: new Date().toISOString() });
    }
  }

  fs.writeFileSync("site-output/wcpa-variants.json", JSON.stringify(results, null, 2));

  const withWcpa = results.filter(r => r.hasWcpa);
  const totalColors = withWcpa.reduce((s, r) => s + r.fields.reduce((fs, f) => fs + f.options.length + (f.colorGroups?.reduce((cs, g) => cs + g.options.length, 0) ?? 0), 0), 0);

  console.log(`\n✅ Saved to site-output/wcpa-variants.json`);
  console.log(`   With WCPA: ${withWcpa.length}/${results.length}`);
  console.log(`   Total options: ${totalColors}`);
  console.log(`   Errors: ${errors}`);
}

main().catch(console.error);
