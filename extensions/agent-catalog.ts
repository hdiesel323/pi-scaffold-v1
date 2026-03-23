/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

/**
 * Agent Catalog Extension v2.1
 * 
 * Provides interactive discovery with division filtering and automated sync.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";
import { parse as parseYaml } from "yaml";

interface AgentMetadata {
  name: string;
  division: string;
  description: string;
  tools: string;
  version?: string;
  tags?: string[];
  capability_score?: number;
  file: string;
}

export default function (pi: ExtensionAPI) {
  let agents: AgentMetadata[] = [];

  function parseAgentFile(filePath: string): AgentMetadata | null {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) return null;
      const frontmatter = parseYaml(match[1]) as any;
      if (!frontmatter.name) return null;
      return {
        name: frontmatter.name,
        division: frontmatter.division || "Eng",
        description: frontmatter.description || "",
        tools: frontmatter.tools || "read,grep,find,ls",
        version: frontmatter.version || "1.0.0",
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        capability_score: typeof frontmatter.capability_score === 'number' ? frontmatter.capability_score : 5,
        file: filePath
      };
    } catch { return null; }
  }

  function scanAgents(cwd: string): AgentMetadata[] {
    const agentDir = path.join(cwd, ".pi", "agents");
    if (!fs.existsSync(agentDir)) return [];
    const found: AgentMetadata[] = [];
    
    const readDirRecursive = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          readDirRecursive(fullPath);
        } else if (file.endsWith(".md")) {
          const meta = parseAgentFile(fullPath);
          if (meta) found.push(meta);
        }
      }
    };
    
    readDirRecursive(agentDir);
    return found;
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  pi.registerCommand("catalog", {
    description: "Browse the agent roster with division filtering.",
    handler: async (_args, ctx) => {
      agents = scanAgents(ctx.cwd);
      const divisions = Array.from(new Set(agents.map(a => a.division))).sort();
      const divChoice = await ctx.ui.select("Select Division", ["All", ...divisions]);
      if (!divChoice) return;

      const filtered = divChoice === "All" ? agents : agents.filter(a => a.division === divChoice);
      const options = filtered.map(a => 
        `[${a.division}] ${a.name} (Score: ${a.capability_score}) - ${a.description}`
      );

      const choice = await ctx.ui.select(`Agents in ${divChoice}`, options);
      if (choice) ctx.ui.notify(`Selected: ${choice}`, "info");
    }
  });

  pi.registerCommand("roster-sync", {
    description: "Sync agents from bolt-ons and migrate to v2.1.",
    handler: async (_args, ctx) => {
      const sourceDir = path.join(ctx.cwd, "bolt-ons", "agency-full", "agents");
      const targetDir = path.join(ctx.cwd, ".pi", "agents");
      if (!fs.existsSync(sourceDir)) return ctx.ui.notify("Bolt-on agents not found.", "error");

      const files = fs.readdirSync(sourceDir).filter(f => f.endsWith(".md"));
      let synced = 0;

      for (const file of files) {
        const content = fs.readFileSync(path.join(sourceDir, file), "utf-8");
        const targetPath = path.join(targetDir, file);
        if (!fs.existsSync(targetPath)) {
          // Simple migration logic
          const division = file.includes("sales") ? "Ops" : file.includes("pipeline") ? "Ops" : "Eng";
          const migrated = content.replace(/name: (.*)/, `name: $1\ndivision: ${division}\nversion: 1.0.0\ntags: [synced]\ncapability_score: 5`);
          fs.writeFileSync(targetPath, migrated);
          synced++;
        }
      }
      ctx.ui.notify(`Synced and migrated ${synced} new agents.`, "success");
      agents = scanAgents(ctx.cwd);
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
    agents = scanAgents(ctx.cwd);
    ctx.ui.setStatus("agent-count", `🤖 ${agents.length} agents`);
  });
}
