#!/usr/bin/env node
/**
 * Auto-heal script — reads TypeScript/ESLint/runtime errors from stdin (or
 * /tmp/errors.txt), then runs an agentic Claude loop that reads source files,
 * understands the problems, and writes fixes directly into the repo.
 *
 * Usage (called by GitHub Actions):
 *   node scripts/claude-fix.mjs < /tmp/errors.txt
 *   echo "$ERRORS" | node scripts/claude-fix.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const SRC_ROOT = path.join(REPO_ROOT, "wedding-portal");
const MAX_TOOL_ROUNDS = 20;

// ── Read error input ──────────────────────────────────────────────────────────
let errorInput = "";
if (!process.stdin.isTTY) {
  errorInput = fs.readFileSync("/dev/stdin", "utf8").trim();
}
if (!errorInput && fs.existsSync("/tmp/errors.txt")) {
  errorInput = fs.readFileSync("/tmp/errors.txt", "utf8").trim();
}
if (!errorInput) {
  console.log("✅ No errors to fix.");
  process.exit(0);
}

console.log("🔍 Errors detected:\n", errorInput.slice(0, 1000));

// ── Tool definitions ──────────────────────────────────────────────────────────
const tools = [
  {
    name: "read_file",
    description: "Read the contents of a file in the repository.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Path relative to the repo root (e.g. wedding-portal/src/app/api/ping/route.ts)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write (overwrite) a file in the repository with new content.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path relative to the repo root",
        },
        content: {
          type: "string",
          description: "Full file content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description: "List files in a directory.",
    input_schema: {
      type: "object",
      properties: {
        dir: {
          type: "string",
          description: "Directory path relative to repo root",
        },
      },
      required: ["dir"],
    },
  },
  {
    name: "done",
    description: "Signal that all fixes have been applied (or no fix is possible).",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Brief description of what was fixed (or why no fix is possible)",
        },
        fixed: {
          type: "boolean",
          description: "true if fixes were applied, false if unresolvable",
        },
      },
      required: ["summary", "fixed"],
    },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────
function executeTool(name, input) {
  if (name === "read_file") {
    const abs = path.join(REPO_ROOT, input.path);
    if (!abs.startsWith(REPO_ROOT)) return { error: "Path outside repo" };
    try {
      return { content: fs.readFileSync(abs, "utf8") };
    } catch (e) {
      return { error: `Cannot read: ${e.message}` };
    }
  }

  if (name === "write_file") {
    const abs = path.join(REPO_ROOT, input.path);
    if (!abs.startsWith(REPO_ROOT)) return { error: "Path outside repo" };
    try {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, input.content, "utf8");
      console.log(`  ✏️  Wrote ${input.path}`);
      return { ok: true };
    } catch (e) {
      return { error: `Cannot write: ${e.message}` };
    }
  }

  if (name === "list_files") {
    const abs = path.join(REPO_ROOT, input.dir);
    if (!abs.startsWith(REPO_ROOT)) return { error: "Path outside repo" };
    try {
      const entries = fs.readdirSync(abs, { withFileTypes: true });
      return {
        files: entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "dir" : "file",
        })),
      };
    } catch (e) {
      return { error: `Cannot list: ${e.message}` };
    }
  }

  return { error: `Unknown tool: ${name}` };
}

// ── Main agentic loop ─────────────────────────────────────────────────────────
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const systemPrompt = `You are an expert Next.js / TypeScript developer fixing a production codebase.
Repository layout:
  wedding-portal/   ← Next.js 15 app (src/app, src/lib, src/components)
  scripts/          ← automation scripts

Rules:
- Read files before modifying them so you understand the full context.
- Apply the minimal fix — do not refactor unrelated code.
- After applying all fixes, call the "done" tool with a summary.
- If an error is a missing env var (not a code bug), explain in "done" and set fixed=false.
- Prefer TypeScript strict-mode safe code (no any casts unless unavoidable).`;

const messages = [
  {
    role: "user",
    content: `The CI/CD pipeline detected the following errors. Please read the relevant source files and fix them:\n\n\`\`\`\n${errorInput}\n\`\`\``,
  },
];

let rounds = 0;
let finalSummary = "";
let wasFixed = false;

while (rounds < MAX_TOOL_ROUNDS) {
  rounds++;

  const stream = await client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    tools,
    messages,
  });

  const response = await stream.finalMessage();
  messages.push({ role: "assistant", content: response.content });

  if (response.stop_reason === "end_turn") {
    console.log("✅ Claude finished without calling done — treating as complete.");
    break;
  }

  if (response.stop_reason !== "tool_use") break;

  const toolResults = [];
  for (const block of response.content) {
    if (block.type !== "tool_use") continue;

    console.log(`🔧 Tool: ${block.name}`, JSON.stringify(block.input).slice(0, 120));

    if (block.name === "done") {
      finalSummary = block.input.summary;
      wasFixed = block.input.fixed;
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "acknowledged" });
      break;
    }

    const result = executeTool(block.name, block.input);
    toolResults.push({
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(result),
    });
  }

  messages.push({ role: "user", content: toolResults });

  // If done tool was called, exit loop
  if (finalSummary) break;
}

console.log("\n── Auto-heal result ──────────────────────────────");
console.log("Fixed:", wasFixed);
console.log("Summary:", finalSummary || "(no summary — check output above)");

// Exit 0 if fixes applied or no code fix possible (so CI can commit)
// Exit 1 only if we hit the round limit without finishing
if (rounds >= MAX_TOOL_ROUNDS && !finalSummary) {
  console.error("❌ Exceeded max tool rounds without resolution");
  process.exit(1);
}
process.exit(0);
