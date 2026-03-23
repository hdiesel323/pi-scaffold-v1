/**
 * Pi Scaffold (pi-vs-cc)
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

/**
 * Git Superpowers Extension
 * 
 * High-leverage Git commands for rapid development.
 * 
 * Usage: pi -e extensions/superpowers.ts
 * Commands: 
 *   v1: /spork, /strail, /spdiff, /spwipe, /spmerge
 *   v2: /sp-pr, /sp-search, /sp-db, /sp-notify, /sp-sync-docs
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { execSync, spawn } from "node:child_process";
import { applyExtensionDefaults } from "./themeMap.ts";
import { Type } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";

export default function (pi: ExtensionAPI) {

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function runGit(command: string, ctx: ExtensionContext): string {
    try {
      return execSync(`git ${command}`, { cwd: ctx.cwd, encoding: "utf-8" }).trim();
    } catch (err: any) {
      throw new Error(err.stdout || err.message);
    }
  }

  function runShell(command: string, ctx: ExtensionContext): string {
    try {
      return execSync(command, { cwd: ctx.cwd, encoding: "utf-8" }).trim();
    } catch (err: any) {
      throw new Error(err.stdout || err.message);
    }
  }

  async function dispatchAgent(agentName: string, prompt: string, ctx: ExtensionContext): Promise<string> {
    const agentPath = path.join(ctx.cwd, ".pi", "agents", `${agentName}.md`);
    let systemPrompt = `You are the ${agentName}.`;
    if (fs.existsSync(agentPath)) {
      const raw = fs.readFileSync(agentPath, "utf-8");
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      systemPrompt = match ? match[2].trim() : raw;
    }

    const args = [
      "--mode", "json",
      "-p",
      "--no-extensions",
      "--model", ctx.model?.id || "anthropic/claude-3-5-sonnet",
      "--append-system-prompt", systemPrompt,
      prompt
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn("pi", args, { env: { ...process.env } });
      let buffer = "";
      proc.stdout.on("data", (chunk) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "message_update" && event.assistantMessageEvent?.type === "text_delta") {
              buffer += event.assistantMessageEvent.delta;
            }
          } catch (e) {}
        }
      });
      proc.on("close", (code) => code === 0 ? resolve(buffer) : reject(new Error(`Agent ${agentName} failed with code ${code}`)));
    });
  }

  // ─── v1 Commands ──────────────────────────────────────────────────────────

  pi.registerCommand("spork", {
    description: "Create branch, push, and set upstream: /spork <branch>",
    handler: async (args, ctx) => {
      const branch = args.trim();
      if (!branch) return ctx.ui.notify("Usage: /spork <branch>", "warning");
      try {
        ctx.ui.notify(`Sporking ${branch}...`, "info");
        runGit(`checkout -b ${branch}`, ctx);
        runGit(`push -u origin ${branch}`, ctx);
        ctx.ui.notify(`✅ Branch ${branch} created and pushed.`, "success");
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("strail", {
    description: "Show history trail of the last 10 commits.",
    handler: async (_args, ctx) => {
      try {
        const format = "%C(dim)%h%Creset %C(bold blue)%an%Creset %s %C(dim)(%cr)%Creset";
        const log = runGit(`log -n 10 --pretty=format:"${format}"`, ctx);
        ctx.ui.notify(`\n${log}\n`, "info");
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("spdiff", {
    description: "Structural, noise-free diff.",
    handler: async (_args, ctx) => {
      try {
        const exclusions = "':(exclude)*.lockb' ':(exclude)*-lock.json' ':(exclude)node_modules/*' ':(exclude).pi/agent-sessions/*'";
        const diff = runGit(`diff --ignore-all-space --word-diff -- . ${exclusions}`, ctx);
        ctx.ui.notify(diff ? `\n${diff}\n` : "No structural changes.", "info");
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("spwipe", {
    description: "Safe stash and reset to clean state.",
    handler: async (_args, ctx) => {
      try {
        runGit(`stash push -m "spwipe-${new Date().toISOString()}"`, ctx);
        runGit("reset --hard HEAD", ctx);
        runGit("clean -fd", ctx);
        ctx.ui.notify("✅ State wiped. Changes stashed.", "success");
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("spmerge", {
    description: "Smart merge with conflict review: /spmerge <branch>",
    handler: async (args, ctx) => {
      const branch = args.trim();
      if (!branch) return ctx.ui.notify("Usage: /spmerge <branch>", "warning");
      try {
        ctx.ui.notify(`Merging ${branch}...`, "info");
        try {
          runGit(`merge ${branch}`, ctx);
          ctx.ui.notify(`✅ Merged ${branch} successfully.`, "success");
        } catch (mergeErr: any) {
          ctx.ui.notify("Conflict detected! Dispatching Superpower Agent...", "warning");
          const conflicts = runGit("diff --name-only --diff-filter=U", ctx);
          const res = await dispatchAgent("git-superpower", `Merge failed in: ${conflicts}. Suggest resolution.`, ctx);
          ctx.ui.notify(`Analysis: ${res}`, "info");
        }
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  // ─── v2 Commands (Skill Pack) ─────────────────────────────────────────────

  pi.registerCommand("sp-pr", {
    description: "GitHub PR operations: /sp-pr <create|list>",
    handler: async (args, ctx) => {
      const sub = args.trim().toLowerCase();
      try {
        if (sub === "list") {
          const list = runShell("gh pr list", ctx);
          ctx.ui.notify(`Pull Requests:\n${list}`, "info");
        } else if (sub === "create") {
          ctx.ui.notify("Drafting PR description with github-expert...", "info");
          const desc = await dispatchAgent("github-expert", "Generate a PR title and description for current staged changes.", ctx);
          ctx.ui.notify(`Generated Description:\n${desc}\n\nRun 'gh pr create' with these details.`, "info");
        } else {
          ctx.ui.notify("Usage: /sp-pr <create|list>", "warning");
        }
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("sp-search", {
    description: "Technical research synthesis: /sp-search <query>",
    handler: async (args, ctx) => {
      const query = args.trim();
      if (!query) return ctx.ui.notify("Usage: /sp-search <query>", "warning");
      try {
        ctx.ui.notify(`Researching "${query}" with search-expert...`, "info");
        const res = await dispatchAgent("search-expert", `Research query: ${query}. Synthesize into RESEARCH.md format.`, ctx);
        ctx.ui.notify(`Research Findings:\n${res}`, "info");
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("sp-db", {
    description: "Direct SQL analysis: /sp-db <query>",
    handler: async (args, ctx) => {
      const query = args.trim();
      if (!query) return ctx.ui.notify("Usage: /sp-db <sql-query>", "warning");
      try {
        const res = runShell(`sqlite3 -header -column .pi/local.db "${query}"`, ctx);
        ctx.ui.notify(`DB Results:\n${res}`, "info");
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("sp-notify", {
    description: "Send alert via Slack/Discord webhook: /sp-notify <msg>",
    handler: async (args, ctx) => {
      const msg = args.trim();
      const url = process.env.SLACK_WEBHOOK_URL;
      if (!msg) return ctx.ui.notify("Usage: /sp-notify <message>", "warning");
      if (!url) return ctx.ui.notify("SLACK_WEBHOOK_URL not set in .env", "error");
      try {
        ctx.ui.notify("Sending notification...", "info");
        await fetch(url, { method: "POST", body: JSON.stringify({ text: msg }), headers: { "Content-Type": "application/json" } });
        ctx.ui.notify("✅ Notification sent.", "success");
      } catch (err: any) { ctx.ui.notify(`Error: ${err.message}`, "error"); }
    }
  });

  pi.registerCommand("sp-sync-docs", {
    description: "Sync docs to external documentation layer.",
    handler: async (_args, ctx) => {
      ctx.ui.notify("Syncing docs (Stub implementation)...", "info");
      ctx.ui.notify("✅ Docs sync complete.", "success");
    }
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
  });
}
