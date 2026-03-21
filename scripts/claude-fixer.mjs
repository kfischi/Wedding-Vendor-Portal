#!/usr/bin/env node
/**
 * Claude Self-Healing Fixer
 * Reads build errors → asks Claude → applies file patches automatically
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ERROR_FILE = process.argv[2] || "/tmp/build-errors.txt";
const PROJECT_DIR = process.argv[3] || "wedding-portal";

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY not set");
  process.exit(1);
}

// ── Read error log ────────────────────────────────────────────────────────────
const errors = fs.readFileSync(ERROR_FILE, "utf-8");
console.log("📋 Error log size:", errors.length, "chars");

// ── Collect relevant source files ────────────────────────────────────────────
const mentionedFiles = new Set();
const filePattern = /(?:\.\/|src\/)[^\s'"]+\.(ts|tsx|js|jsx)/g;
let m;
while ((m = filePattern.exec(errors)) !== null) {
  mentionedFiles.add(m[0].replace("./", ""));
}

const fileContents = {};
for (const rel of mentionedFiles) {
  const abs = path.join(PROJECT_DIR, rel);
  if (fs.existsSync(abs)) {
    fileContents[rel] = fs.readFileSync(abs, "utf-8");
  }
}

console.log("📁 Files with errors:", [...mentionedFiles]);

// ── Build Claude prompt ───────────────────────────────────────────────────────
const fileSection = Object.entries(fileContents)
  .map(([f, c]) => `### ${f}\n\`\`\`typescript\n${c}\n\`\`\``)
  .join("\n\n");

const prompt = `You are an expert Next.js 15 / TypeScript engineer fixing build errors.

## Build Errors
\`\`\`
${errors.slice(0, 8000)}
\`\`\`

## Source Files
${fileSection.slice(0, 20000)}

## Instructions
1. Analyze every error carefully
2. Return ONLY a JSON array of patches — no prose, no markdown fences
3. Each patch: { "file": "relative/path.tsx", "content": "FULL file content after fix" }
4. Fix ALL errors in one pass
5. Do NOT change logic — only fix type errors, missing imports, lint issues
6. Preserve Hebrew strings and RTL attributes exactly

Return format (raw JSON only):
[{"file":"src/...","content":"..."},...]`;

// ── Call Claude API ───────────────────────────────────────────────────────────
console.log("🤖 Calling Claude to analyze errors...");

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  }),
});

if (!response.ok) {
  const err = await response.text();
  console.error("❌ Claude API error:", err);
  process.exit(1);
}

const data = await response.json();
const raw = data.content[0].text.trim();

// ── Parse patches ─────────────────────────────────────────────────────────────
let patches;
try {
  // Strip possible markdown fences
  const json = raw.replace(/^```[a-z]*\n?/m, "").replace(/\n?```$/m, "").trim();
  patches = JSON.parse(json);
} catch (e) {
  console.error("❌ Failed to parse Claude response as JSON:", raw.slice(0, 500));
  process.exit(1);
}

console.log(`🔧 Applying ${patches.length} patches...`);

// ── Apply patches ─────────────────────────────────────────────────────────────
let applied = 0;
for (const { file, content } of patches) {
  const abs = path.join(PROJECT_DIR, file);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
  console.log(`  ✅ Patched: ${file}`);
  applied++;
}

console.log(`\n✅ Applied ${applied}/${patches.length} patches`);

// ── Quick sanity check ────────────────────────────────────────────────────────
try {
  execSync(`cd ${PROJECT_DIR} && npx tsc --noEmit 2>&1`, { stdio: "pipe" });
  console.log("✅ TypeScript: no errors after fix");
} catch (e) {
  console.warn("⚠️  TypeScript still has errors — may need another pass");
  console.warn(e.stdout?.toString().slice(0, 1000));
  process.exit(1);
}
