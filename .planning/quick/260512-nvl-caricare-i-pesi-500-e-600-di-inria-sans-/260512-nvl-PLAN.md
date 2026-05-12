---
phase: quick-260512-nvl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/routes/__root.tsx
autonomous: true
requirements: [QUICK-260512-NVL]
must_haves:
  truths:
    - "Inria Sans is loaded with weights 500 and 600 (no faux-bold synthesis for font-medium / font-semibold body text)"
    - "Cormorant Garamond font link is unchanged"
    - "Typecheck baseline is unchanged after the edit"
  artifacts:
    - path: "src/routes/__root.tsx"
      provides: "bunny.net font <link> tags with inria-sans wght including 500 and 600"
      contains: "inria-sans:wght@300;400;500;600;700"
  key_links:
    - from: "src/routes/__root.tsx preload link"
      to: "fonts.bunny.net inria-sans css"
      via: "wght@300;400;500;600;700"
      pattern: "inria-sans:wght@300;400;500;600;700"
    - from: "src/routes/__root.tsx combined stylesheet link"
      to: "fonts.bunny.net inria-sans css"
      via: "ital,wght with 0,500 and 0,600"
      pattern: "inria-sans:ital,wght@0,300;0,400;0,500;0,600;0,700"
---

<objective>
Add font weights 500 (medium) and 600 (semibold) to the Inria Sans bunny.net `<link>` URLs in `src/routes/__root.tsx`. The codebase uses `font-medium` (~443x) and `font-semibold` (~234x) on body text, but Inria Sans is currently loaded only with `wght@300;400;700`, forcing the browser to synthesize faux-bold for those weights.

Purpose: Render proper 500/600 glyphs instead of synthetic faux-bold — better visual quality and correctness for body text.
Output: Updated `<link>` URLs (preload + combined stylesheet) in `__root.tsx`. Cormorant Garamond untouched.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# The target file — only the `links` array in createRootRoute matters (around lines 100-131)
@src/routes/__root.tsx

<interfaces>
Current state of the three font-related links in src/routes/__root.tsx (links: [...] array):

1. Preload (Cormorant) — DO NOT TOUCH:
   href: "https://fonts.bunny.net/css?family=cormorant-garamond:wght@400;500;600;700&display=swap"

2. Preload (Inria Sans) — line ~123 — MUST UPDATE:
   current: "https://fonts.bunny.net/css?family=inria-sans:wght@300;400;700&display=swap"
   target:  "https://fonts.bunny.net/css?family=inria-sans:wght@300;400;500;600;700&display=swap"

3. Combined stylesheet (Cormorant + Inria Sans) — line ~128 — MUST UPDATE the inria-sans family only:
   current: "https://fonts.bunny.net/css?family=cormorant-garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=inria-sans:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap"
   target:  "https://fonts.bunny.net/css?family=cormorant-garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=inria-sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,700&display=swap"
   (cormorant-garamond:ital,wght@... segment stays byte-for-byte identical; only the inria-sans:ital,wght segment gains 0,500 and 0,600 in the upright list. Italic 500/600 are NOT needed — body text never uses italic medium/semibold — so the 1,xxx list is left as-is.)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add wght 500 and 600 to the Inria Sans bunny.net font links</name>
  <files>src/routes/__root.tsx</files>
  <action>
In the `links: [...]` array inside `createRootRoute({ head: () => ({ ... }) })`:

1. Update the Inria Sans preload link href (currently `https://fonts.bunny.net/css?family=inria-sans:wght@300;400;700&display=swap`) to `https://fonts.bunny.net/css?family=inria-sans:wght@300;400;500;600;700&display=swap` — i.e. insert `500;600;` between `400;` and `700`.

2. Update the combined stylesheet link href: in the `&family=inria-sans:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700` segment, insert `0,500;0,600;` between `0,400;` and `0,700;` so it becomes `&family=inria-sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,700`. Do NOT touch the `cormorant-garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500` segment or the `&display=swap` suffix — only the inria-sans family changes, and only its upright (`0,`) weight list (italic 500/600 not needed for body text).

3. Leave the Cormorant Garamond preload link (`family=cormorant-garamond:wght@400;500;600;700`) completely unchanged — it already has 500 and 600.

Use a precise string Edit; do not reformat surrounding lines.
  </action>
  <verify>
    <automated>cd /Users/pasqualemorra/Projects/calzoleriaprevenzano && grep -n "inria-sans:wght@300;400;500;600;700" src/routes/__root.tsx && grep -n "inria-sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,700" src/routes/__root.tsx && grep -c "cormorant-garamond:wght@400;500;600;700" src/routes/__root.tsx</automated>
  </verify>
  <done>
Both `inria-sans` URLs in `src/routes/__root.tsx` contain `;500;600;` (preload: `300;400;500;600;700`; combined: `0,400;0,500;0,600;0,700`). Cormorant Garamond links are byte-identical to before. `pnpm typecheck` error count equals the pre-edit baseline (25) — no new errors on `__root.tsx`.
  </done>
</task>

</tasks>

<verification>
- `grep` confirms `inria-sans:wght@300;400;500;600;700` present in `__root.tsx`.
- `grep` confirms `inria-sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,700` present in `__root.tsx`.
- `grep` confirms the unchanged `cormorant-garamond:wght@400;500;600;700` preload link still present.
- `pnpm typecheck` baseline unchanged (25 → 25; pre-existing errors in scripts/* and admin/api files are out of scope per CLAUDE.md).
- (Optional, post-deploy) Browser DevTools → Network: bunny.net CSS responses include `font-weight: 500` and `font-weight: 600` `@font-face` blocks for Inria Sans; no faux-bold synthesis on `font-medium` / `font-semibold` body text.
</verification>

<success_criteria>
- Both Inria Sans bunny.net `<link>` URLs request weights 300, 400, 500, 600, 700 (upright). Italic list unchanged.
- Cormorant Garamond links untouched.
- Typecheck baseline unchanged. No other files modified.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-nvl-caricare-i-pesi-500-e-600-di-inria-sans-/260512-nvl-SUMMARY.md`.
</output>
