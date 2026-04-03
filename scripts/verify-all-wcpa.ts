/**
 * verify-all-wcpa.ts
 * 
 * Fetches ALL 118 product pages from calzoleriaprevenzano.it and extracts
 * a summary of WCPA fields for each. Compares against our scraper output
 * to find ALL discrepancies.
 * 
 * Output: site-output/wcpa-verification.json
 */

import * as fs from "fs";
import * as https from "https";

interface ScrapedField {
  type: string;
  name: string;
  optionsCount: number;
  colorGroupsCount: number;
  optionLabels: string[];
  hasTacco: boolean;
}

interface ScrapedProduct {
  slug: string;
  name: string;
  hasWcpa: boolean;
  fields: ScrapedField[];
}

interface VerifiedField {
  wcpaType: string;
  label: string;
  optionCount: number;
  optionLabels: string[];
  hasPriceModifier: boolean;
  conditionalParent?: string;
  conditionalValue?: string;
}

interface VerifiedProduct {
  slug: string;
  name: string;
  originalUrl: string;
  hasWcpa: boolean;
  fields: VerifiedField[];
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode === 200) {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      } else {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function decodeEntities(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function extractWcpaSummary(html: string): VerifiedField[] {
  const fields: VerifiedField[] = [];
  
  // Find the cart form
  const cartStart = html.indexOf('<form class="cart"');
  if (cartStart < 0) return fields;
  
  let depth = 0;
  let formEnd = cartStart;
  for (let i = cartStart; i < html.length; i++) {
    if (html.slice(i, i + 5) === "<form") depth++;
    if (html.slice(i, i + 7) === "</form>") { depth--; if (depth === 0) { formEnd = i + 7; break; } }
  }
  const formHtml = html.slice(cartStart, formEnd);
  
  // Find all wcpa_form_item opening tags
  const itemRegex = /<div\s+class="([^"]*wcpa_form_item[^"]*)"\s+([^>]*)>/g;
  const items: Array<{ id: string; type: string; label: string; rules: string | null; attrs: string; pos: number }> = [];
  let m: RegExpExecArray | null;
  
  while ((m = itemRegex.exec(formHtml)) !== null) {
    const classes = m[1];
    const attrs = m[2];
    const idMatch = attrs.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    
    const typeMatch = classes.match(/wcpa_type_(\S+)/);
    const type = typeMatch ? typeMatch[1] : "";
    
    const searchArea = formHtml.slice(m.index, m.index + 500);
    const labelMatch = searchArea.match(/<label[^>]*>([^<]+)<\/label>/);
    const label = labelMatch ? labelMatch[1].replace(/\s*\*\s*$/, "").trim() : idMatch[1];
    
    const rulesMatch = attrs.match(/data-rules='([^']+)'/);
    
    items.push({ id: idMatch[1], type, label, rules: rulesMatch ? decodeEntities(rulesMatch[1]) : null, attrs, pos: m.index });
  }
  
  // Extract content for each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const contentStart = formHtml.indexOf('id="' + item.id + '"', item.pos) + item.id.length + 2;
    const nextPos = i + 1 < items.length ? formHtml.indexOf('id="' + items[i + 1].id + '"', contentStart) : formHtml.length;
    const content = formHtml.slice(contentStart, nextPos > 0 ? nextPos : formHtml.length);
    
    // Count options based on field type
    let optionCount = 0;
    const optionLabels: string[] = [];
    let hasPriceModifier = false;
    let conditionalParent: string | undefined;
    let conditionalValue: string | undefined;
    
    if (item.type === "radio-group") {
      const radioRegex = /<input[^>]*value="([^"]+)"[^>]*type="radio"[^>]*>[\s\S]*?<label[^>]*>(?:<[^>]*>)*([^<]+)/g;
      let rm: RegExpExecArray | null;
      while ((rm = radioRegex.exec(content)) !== null) {
        optionLabels.push(rm[2].trim());
      }
      optionCount = optionLabels.length;
      // Try reverse attribute order
      if (optionCount === 0) {
        const radioRegex2 = /<input[^>]*type="radio"[^>]*value="([^"]+)"[^>]*>[\s\S]*?<label[^>]*>(?:<[^>]*>)*([^<]+)/g;
        while ((rm = radioRegex2.exec(content)) !== null) {
          optionLabels.push(rm[2].trim());
        }
        optionCount = optionLabels.length;
      }
    } else if (item.type === "image-group") {
      // Count wcpa_image_desc or label tags
      const descRegex = /class="wcpa_image_desc"[^>]*>\s*([^<]+)/g;
      let dm: RegExpExecArray | null;
      while ((dm = descRegex.exec(content)) !== null) {
        optionLabels.push(dm[1].trim());
      }
      // Fallback: label tags
      if (optionLabels.length === 0) {
        const labelRegex = /<label[^>]*>([\s\S]*?)<\/label>/g;
        while ((m = labelRegex.exec(content)) !== null) {
          const inner = m[1].replace(/<[^>]+>/g, "").trim();
          if (inner.length >= 2 && inner.length < 60 && !inner.includes("*")) {
            optionLabels.push(inner);
          }
        }
      }
      optionCount = optionLabels.length;
      // Check for price modifiers
      if (content.includes("wcpa_has_price") || content.includes("wcpa_opt_price")) {
        hasPriceModifier = true;
      }
    } else if (item.type === "select" || item.type === "select-box") {
      const optRegex = /<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g;
      let om: RegExpExecArray | null;
      while ((om = optRegex.exec(content)) !== null) {
        if (om[1]) optionLabels.push(om[2].trim());
      }
      optionCount = optionLabels.length;
    }
    
    // Extract conditional rules
    if (item.rules) {
      try {
        const rules = JSON.parse(item.rules);
        const clVal = findClVal(rules);
        if (clVal) {
          conditionalParent = clVal.cl_field;
          conditionalValue = clVal.cl_val;
        }
      } catch { /* skip */ }
    }
    
    fields.push({
      wcpaType: item.type,
      label: item.label,
      optionCount,
      optionLabels,
      hasPriceModifier,
      conditionalParent,
      conditionalValue,
    });
  }
  
  return fields;
}

function findClVal(rules: Record<string, unknown>): { cl_field: string; cl_val: string } | null {
  if (rules.cl_field && rules.cl_val) {
    return { cl_field: String(rules.cl_field), cl_val: String((rules.cl_val as { value: string }).value) };
  }
  if (Array.isArray(rules.rules)) {
    for (const r of rules.rules) {
      const found = findClVal(r as Record<string, unknown>);
      if (found) return found;
    }
  }
  if (typeof rules.rules === "object" && rules.rules !== null && !Array.isArray(rules.rules)) {
    return findClVal(rules.rules as Record<string, unknown>);
  }
  return null;
}

async function main() {
  const scraped = JSON.parse(fs.readFileSync("site-output/scraped-products.json", "utf-8"));
  const ourData = JSON.parse(fs.readFileSync("site-output/wcpa-variants.json", "utf-8"));
  
  const results: VerifiedProduct[] = [];
  const discrepancies: string[] = [];
  
  console.log(`\n🔍 Verifying ALL ${scraped.products.length} products against original site...\n`);
  
  let verified = 0;
  let errors = 0;
  
  for (let i = 0; i < scraped.products.length; i++) {
    const p = scraped.products[i];
    const short = p.name.length > 30 ? p.name.slice(0, 30) + "…" : p.name;
    
    try {
      const html = await fetchUrl(p.originalUrl);
      const fields = extractWcpaSummary(html);
      const hasWcpa = fields.length > 0;
      
      results.push({ slug: p.slug, name: p.name, originalUrl: p.originalUrl, hasWcpa, fields });
      
      // Compare with our scraper
      const our = ourData.find((x: { slug: string }) => x.slug === p.slug);
      
      if (hasWcpa && our?.hasWcpa) {
        const ourFieldCount = our.fields.length;
        const actualFieldCount = fields.length;
        const ourTotalOpts = our.fields.reduce((s: number, f: { options: unknown[]; colorGroups?: { options: unknown[] }[] }) => {
          let fs = s + f.options.length;
          if (f.colorGroups) fs += f.colorGroups.reduce((cs: number, g: { options: unknown[] }) => cs + g.options.length, 0);
          return fs;
        }, 0);
        const actualTotalOpts = fields.reduce((s, f) => s + f.optionCount, 0);
        
        // Check for discrepancies
        if (actualFieldCount !== ourFieldCount) {
          discrepancies.push(`⚠️ ${p.name}: field count MISMATCH (we=${ourFieldCount}, actual=${actualFieldCount})`);
        }
        if (Math.abs(actualTotalOpts - ourTotalOpts) > 1) {
          discrepancies.push(`⚠️ ${p.name}: option count MISMATCH (we=${ourTotalOpts}, actual=${actualTotalOpts})`);
        }
        
        // Check specific fields
        const ourHasRadio = our.fields.some((f: { type: string }) => f.type === "radio");
        const actualHasRadio = fields.some(f => f.wcpaType === "radio-group");
        if (ourHasRadio !== actualHasRadio) {
          discrepancies.push(`⚠️ ${p.name}: radio presence MISMATCH (we=${ourHasRadio}, actual=${actualHasRadio})`);
        }
        
        // Check for missed textarea fields
        const hasTextarea = fields.some(f => f.wcpaType === "textarea");
        // Our scraper doesn't track textarea - note it
        
        // Check for "Scegli il tipo di fondo" select (bambini)
        const hasFondo = fields.some(f => f.label.includes("fondo") || f.label.includes("Fondo"));
        
        if ((hasTextarea || hasFondo) && actualFieldCount > ourFieldCount) {
          discrepancies.push(`  → Missing field(s): ${[hasTextarea ? "textarea(Note)" : "", hasFondo ? "select(Fondo)" : ""].filter(Boolean).join(", ")}`);
        }
        
        if (actualTotalOpts !== ourTotalOpts) {
          discrepancies.push(`  → Actual opt labels: ${fields.map(f => `${f.label}(${f.optionCount})`).join(", ")}`);
        }
      } else if (hasWcpa && !our?.hasWcpa) {
        discrepancies.push(`❌ ${p.name}: we say NO WCPA but site HAS ${fields.length} fields`);
      } else if (!hasWcpa && our?.hasWcpa) {
        discrepancies.push(`❌ ${p.name}: we say HAS WCPA but site has NONE`);
      }
      
      if (hasWcpa) {
        const fieldSummary = fields.map(f => `${f.wcpaType}:${f.label}(${f.optionCount})${f.conditionalParent ? `[cond]` : ""}`).join(", ");
        process.stdout.write(`\r  [${String(i+1).padStart(3)}/${scraped.products.length}] ✅ ${short} → ${fields.length} fields: ${fieldSummary}        `.slice(0, 120) + (fieldSummary.length > 120 ? "..." : ""));
      } else {
        if ((i + 1) % 10 === 0) process.stdout.write(`\r  [${String(i+1).padStart(3)}/${scraped.products.length}] ⬜ ${short} (simple)              `);
      }
      
      verified++;
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    } catch (err) {
      errors++;
      results.push({ slug: p.slug, name: p.name, originalUrl: p.originalUrl, hasWcpa: false, fields: [] });
    }
  }
  
  // Save results
  fs.writeFileSync("site-output/wcpa-verification.json", JSON.stringify(results, null, 2));
  
  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`VERIFICATION COMPLETE: ${verified} verified, ${errors} errors`);
  console.log(`${"=".repeat(60)}`);
  
  if (discrepancies.length > 0) {
    console.log(`\n⚠️  FOUND ${discrepancies.length} DISCREPANCIES:\n`);
    discrepancies.forEach(d => console.log(d));
  } else {
    console.log("\n✅ NO discrepancies found — scraper is fully accurate!");
  }
  
  // Summary stats
  const withWcpa = results.filter(p => p.hasWcpa);
  const fieldTypes = new Set<string>();
  for (const p of withWcpa) for (const f of p.fields) fieldTypes.add(f.wcpaType);
  
  console.log(`\n=== STATS ===`);
  console.log(`Total products verified: ${verified}`);
  console.log(`With WCPA: ${withWcpa.length}`);
  console.log(`Without WCPA: ${results.length - withWcpa.length}`);
  console.log(`WCPA field types found:`, [...fieldTypes]);
  console.log(`Total fields: ${withWcpa.reduce((s, p) => s + p.fields.length, 0)}`);
}

main().catch(console.error);
