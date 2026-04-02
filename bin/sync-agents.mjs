#!/usr/bin/env node

/**
 * sync-agents.mjs — Multi-tool agent sync (zero dependencies)
 *
 * Reads .github/agents/*.agent.md (VS Code Copilot format)
 * and generates:
 *   - .opencode/modes/*.md    → OpenCode custom modes
 *   - .cursor/rules/*.mdc     → Cursor rules
 *   - AGENTS.md               → Cross-tool global instructions
 *
 * Usage:
 *   node bin/sync-agents.mjs          # sync all
 *   node bin/sync-agents.mjs --check  # dry-run, just report
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const AGENTS_DIR = join(ROOT, ".github", "agents");
const OPENCODE_DIR = join(ROOT, ".opencode", "modes");
const CURSOR_DIR = join(ROOT, ".cursor", "rules");

const DRY_RUN = process.argv.includes("--check");

// Minimal YAML frontmatter parser — handles string, boolean, number, arrays
function parseFrontmatter(raw) {
  const obj = {};
  for (const line of raw.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (value === "null" || value === "") value = null;
    else if (/^-?\d+$/.test(value)) value = parseInt(value, 10);
    else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    obj[key] = value;
  }
  return obj;
}

const TOOL_PROFILES = {
  research:               { read: true, write: true, edit: false, bash: true, grep: true, glob: true },
  design:                 { read: true, write: true, edit: false, bash: false, grep: true, glob: true },
  "quality-check":        { read: true, write: false, edit: false, bash: false, grep: true, glob: true },
  "deep-debug":           { read: true, write: true, edit: false, bash: true, grep: true, glob: true },
  "features-deepscan":    { read: true, write: true, edit: false, bash: true, grep: true, glob: true },
  "refactoring-deepsearch": { read: true, write: false, edit: false, bash: false, grep: true, glob: true },
  "test-runner":          { read: true, write: true, edit: false, bash: true, grep: true, glob: true },
};

const DEFAULT_TOOLS = { read: true, write: true, edit: true, bash: true, grep: true, glob: true };

const AGENT_GROUPS = {
  pipeline: {
    label: "Pipeline Principale",
    agents: [
      "dispatcher", "pipeline", "research", "design", "schema",
      "codegen-foundation", "codegen-pages", "codegen-api", "compliance", "audit",
    ],
  },
  postPipeline: {
    label: "Post-Pipeline",
    agents: [
      "features-deepscan", "features-coding", "features-redesign",
      "refactoring-deepsearch", "refactoring-code",
      "deep-debug", "quality-check", "test-writer", "test-runner",
    ],
  },
};

function parseAgentFile(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error(`Invalid agent file: ${filePath}`);

  const fm = parseFrontmatter(fmMatch[1]);
  const body = fmMatch[2].trim();

  return {
    name: fm.name,
    description: fm.description || "",
    body,
  };
}

function generateOpenCode(agent) {
  const tools = TOOL_PROFILES[agent.name] || DEFAULT_TOOLS;
  const toolLines = Object.entries(tools)
    .map(([tool, enabled]) => `  ${tool}: ${enabled}`)
    .join("\n");

  return `---
temperature: 0.1
tools:
${toolLines}
---

${agent.body}
`;
}

function generateCursorRule(agent) {
  const escaped = agent.description.replace(/"/g, '\\"');
  return `---
description: "${escaped}"
globs:
alwaysApply: false
---

${agent.body}
`;
}

function generateAGENTSmd(agents) {
  const lines = [
    "# Site Generator — Multi-Agent System",
    "",
    "## Available Agents",
    "",
    "This project uses a multi-agent system for site generation. Agents are defined in `.github/agents/` and are available in:",
    "",
    "- **VS Code Copilot**: native via `.github/agents/*.agent.md` (mode picker)",
    "- **OpenCode**: via `.opencode/modes/*.md` (Tab to switch)",
    "- **Cursor**: via `.cursor/rules/*.mdc` (mention @rules in chat)",
    "",
  ];

  for (const [, group] of Object.entries(AGENT_GROUPS)) {
    lines.push(`### ${group.label}`);
    lines.push("");
    for (const agentName of group.agents) {
      const agent = agents.find((a) => a.name === agentName);
      if (agent) {
        lines.push(`- **@${agent.name}** — ${agent.description}`);
      }
    }
    lines.push("");
  }

  lines.push("## Quick Start");
  lines.push("");
  lines.push("1. **Dispatcher**: Start here. Describe your project -> get a plan.");
  lines.push("2. **Research**: Deep competitive analysis -> Site Blueprint.");
  lines.push("3. **Design**: Design Direction with DNA Fingerprint.");
  lines.push("4. **Schema**: Prisma schema + seed + Docker setup.");
  lines.push("5. **Codegen Foundation -> Pages -> API**: Full code generation.");
  lines.push("6. **Compliance**: Auth, GDPR, payments, security.");
  lines.push("7. **Audit**: Final validation + Anti-AI Smell Test.");
  lines.push("");
  lines.push("Or use **Pipeline** to run all phases in a single chat.");
  lines.push("");

  return lines.join("\n");
}

// ---- Main ----

const entries = readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".agent.md")).sort();
const agents = entries.map((f) => parseAgentFile(join(AGENTS_DIR, f)));

console.log(`Found ${agents.length} agents in .github/agents/`);

if (DRY_RUN) {
  console.log("\n[DRY RUN] Would generate:\n");
  for (const agent of agents) {
    console.log(`  .opencode/modes/${agent.name}.md`);
    console.log(`  .cursor/rules/${agent.name}.mdc`);
  }
  console.log("  AGENTS.md");
  process.exit(0);
}

mkdirSync(OPENCODE_DIR, { recursive: true });
for (const agent of agents) {
  writeFileSync(join(OPENCODE_DIR, `${agent.name}.md`), generateOpenCode(agent), "utf-8");
  console.log(`  [opencode] ${agent.name}.md`);
}

mkdirSync(CURSOR_DIR, { recursive: true });
for (const agent of agents) {
  writeFileSync(join(CURSOR_DIR, `${agent.name}.mdc`), generateCursorRule(agent), "utf-8");
  console.log(`  [cursor]   ${agent.name}.mdc`);
}

writeFileSync(join(ROOT, "AGENTS.md"), generateAGENTSmd(agents), "utf-8");
console.log("  [global]   AGENTS.md");

console.log(`\nDone! ${agents.length} agents synced across 3 targets.`);
