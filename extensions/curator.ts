/**
 * Pi Scaffold (pi-vs-cc)
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

/**
 * Curator Extension
 * 
 * Monitors upstream repositories for architectural alignment and feature parity.
 * 
 * Usage: pi -e extensions/curator.ts
 * Commands: /curate, /curate-apply <id>
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { spawn, execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";
import { parse as parseYaml } from "yaml";

interface Proposal {
  id: string;
  repo: string;
  summary: string;
  rationale: string;
  implementation_path: string;
  status: 'pending' | 'applied' | 'rejected';
}

export default function (pi: ExtensionAPI) {
  const curationLogPath = (ctx: ExtensionContext) => path.join(ctx.cwd, ".pi", "maintenance", "curation-log.json");

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function getReadme(repo: string): string {
    try {
      // Try GitHub CLI first
      const output = execSync(`gh repo view ${repo} --json readme`, { encoding: 'utf-8' });
      return JSON.parse(output).readme;
    } catch (e) {
      try {
        // Fallback to raw github content curl
        return execSync(`curl -sSL https://raw.githubusercontent.com/${repo}/main/README.md`, { encoding: 'utf-8' });
      } catch (err) {
        return `Failed to fetch README for ${repo}`;
      }
    }
  }

  async function dispatchAgent(agentName: string, prompt: string, ctx: ExtensionContext): Promise<string> {
    const args = [
      "--mode", "json",
      "-p",
      "--no-extensions",
      "--model", ctx.model?.id || "anthropic/claude-3-5-sonnet",
      "--append-system-prompt", `You are acting as the ${agentName}. Analyze and respond in valid JSON format where requested.`,
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
      proc.on("close", (code) => code === 0 ? resolve(buffer) : reject(new Error(`Exit code ${code}`)));
    });
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  pi.registerCommand("curate", {
    description: "Scan upstream repositories for update proposals.",
    handler: async (_args, ctx) => {
      ctx.ui.setStatus("curator-status", "🔍 Curator: Analyzing...");
      ctx.ui.notify("Fetching upstream documentation...", "info");

      const registryPath = path.join(ctx.cwd, ".pi", "maintenance", "upstream.yaml");
      if (!fs.existsSync(registryPath)) return ctx.ui.notify("Upstream registry not found.", "error");

      try {
        const config = parseYaml(fs.readFileSync(registryPath, "utf-8"));
        const repos = config.repos || [];
        let contextBuffer = "Current Upstream READMEs:\n\n";

        for (const repo of repos) {
          ctx.ui.notify(`Processing ${repo}...`, "info");
          const readme = getReadme(repo);
          contextBuffer += `--- REPO: ${repo} ---\n${readme.slice(0, 3000)}\n\n`;
        }

        ctx.ui.notify("Analyzing gaps with curator agent...", "info");
        const response = await dispatchAgent("curator", `Based on these READMEs, identify missing features or patterns in our current toolkit. Return a JSON array of proposals with id, repo, summary, rationale, and implementation_path fields.\n\n${contextBuffer}`, ctx);
        
        // Clean up response if it has markdown fences
        const jsonStr = response.replace(/```json\n?|\n?```/g, "").trim();
        const proposals: Proposal[] = JSON.parse(jsonStr);

        const logPath = curationLogPath(ctx);
        const existing: Proposal[] = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, "utf-8")) : [];
        const merged = [...existing, ...proposals.map(p => ({ ...p, status: 'pending' as const }))];
        
        fs.writeFileSync(logPath, JSON.stringify(merged, null, 2));

        ctx.ui.notify(`Generated ${proposals.length} new proposals. Check .pi/maintenance/curation-log.json`, "success");
        ctx.ui.setStatus("curator-status", "🔍 Curator: Idle");
      } catch (err: any) {
        ctx.ui.notify(`Curation failed: ${err.message}`, "error");
        ctx.ui.setStatus("curator-status", "🔍 Curator: Error");
      }
    }
  });

  pi.registerCommand("curate-apply", {
    description: "Apply an upstream proposal: /curate-apply <id>",
    handler: async (args, ctx) => {
      const id = args.trim();
      const logPath = curationLogPath(ctx);
      if (!fs.existsSync(logPath)) return ctx.ui.notify("No proposals found.", "warning");

      const proposals: Proposal[] = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      const proposal = proposals.find(p => p.id === id);

      if (!proposal) return ctx.ui.notify(`Proposal ${id} not found.`, "error");

      ctx.ui.notify(`Applying proposal: ${proposal.summary}...`, "info");

      try {
        const result = await dispatchAgent("builder", `Implement the following proposal from ${proposal.repo}:\n\nPath: ${proposal.implementation_path}\nSummary: ${proposal.summary}\nRationale: ${proposal.rationale}`, ctx);
        
        proposal.status = 'applied';
        fs.writeFileSync(logPath, JSON.stringify(proposals, null, 2));
        
        ctx.ui.notify(`✅ Applied ${id}:\n${result.slice(0, 500)}...`, "success");
      } catch (err: any) {
        ctx.ui.notify(`Failed to apply proposal: ${err.message}`, "error");
      }
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
    ctx.ui.setStatus("curator-status", "🔍 Curator: Idle");
    ctx.ui.setFooter((_tui, theme) => ({
        dispose: () => {},
        invalidate: () => {},
        render: (width: number) => {
          return [theme.fg("dim", " 🔍 Curator: Ready for analysis ").padEnd(width)];
        }
      }));
  });
}
