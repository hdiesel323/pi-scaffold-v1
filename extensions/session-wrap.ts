/**
 * Pi Swarm — Session Wrap Extension
 * License: MIT
 * Copyright (c) 2026 Pi Swarm Maintainers
 */

import { ExtensionAPI, isToolCallEventType } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import * as yaml from "js-yaml";
import { applyExtensionTheme } from "./themeMap.js";

const EXTENSION_NAME = "session-wrap";

interface WrapConfig {
  external_vault_path: string;
  archive_logs_path: string;
  zettelkasten_mcp_path: string;
}

export default function(api: ExtensionAPI) {
  const theme = applyExtensionTheme(api, EXTENSION_NAME);

  api.registerCommand({
    name: "wrap",
    description: "Automate project closure and knowledge synchronization.",
    parameters: Type.Object({
      summary: Type.String({ description: "High-density summary of the session work." }),
    }),
    handler: async (args) => {
      const { summary } = args;
      const timestamp = new Date().toISOString();
      const wrapConfigPath = path.join(process.cwd(), ".pi/wrap-config.yaml");

      if (!fs.existsSync(wrapConfigPath)) {
        api.notify("error", "Session Wrap configuration not found at .pi/wrap-config.yaml");
        return;
      }

      const config = yaml.load(fs.readFileSync(wrapConfigPath, "utf-8")) as WrapConfig;

      try {
        api.setStatus("info", "Starting Session Wrap...");

        // 1. Internal Sync: TRANSITION.md
        const transitionPath = path.join(process.cwd(), "docs/TRANSITION.md");
        const transitionEntry = `\n\n### Session Wrap: ${timestamp}\n- **Summary**: ${summary}\n`;
        fs.appendFileSync(transitionPath, transitionEntry);

        // 2. Internal Sync: ZETTELGHEST.md
        const zettelPath = path.join(process.cwd(), "docs/ZETTELGHEST.md");
        const agentsCount = fs.readdirSync(path.join(process.cwd(), ".pi/agents"), { recursive: true })
          .filter(f => f.endsWith(".md")).length;
        const extensions = fs.readdirSync(path.join(process.cwd(), "extensions"))
          .filter(f => f.endsWith(".ts"));
        
        let zettelContent = fs.readFileSync(zettelPath, "utf-8");
        // Simple regex update for agent count and extension list
        zettelContent = zettelContent.replace(/Agents \(\d+\)/, `Agents (${agentsCount})`);
        // Find the Extensions section and replace its list
        const extList = extensions.map(e => `- \`${e}\``).join("\n");
        const extHeader = "## 🔌 Power Suite Extensions";
        const nextHeaderIdx = zettelContent.indexOf("##", zettelContent.indexOf(extHeader) + extHeader.length);
        const prefix = zettelContent.substring(0, zettelContent.indexOf(extHeader) + extHeader.length);
        const suffix = nextHeaderIdx !== -1 ? zettelContent.substring(nextHeaderIdx) : "";
        zettelContent = `${prefix}\n${extList}\n\n${suffix}`;
        fs.writeFileSync(zettelPath, zettelContent);

        // 3. External Vault Sync
        if (!fs.existsSync(config.external_vault_path)) {
          fs.mkdirSync(config.external_vault_path, { recursive: true });
        }
        fs.copyFileSync(transitionPath, path.join(config.external_vault_path, "TRANSITION.md"));
        fs.copyFileSync(zettelPath, path.join(config.external_vault_path, "ZETTELGHEST.md"));

        // 4. Archive Log
        if (!fs.existsSync(config.archive_logs_path)) {
          fs.mkdirSync(config.archive_logs_path, { recursive: true });
        }
        const logName = `session-${timestamp.replace(/[:.]/g, "-")}.md`;
        const modifiedFiles = execSync("find . -maxdepth 3 -not -path '*/.*' -mtime -1").toString();
        const logContent = `# Session Log: ${timestamp}\n\n## Summary\n${summary}\n\n## Modified Files (24h)\n\`\`\`\n${modifiedFiles}\n\`\`\``;
        fs.writeFileSync(path.join(config.archive_logs_path, logName), logContent);

        // 5. Zettelkasten MCP Indexing
        try {
          api.setStatus("info", "Indexing Zettelkasten...");
          execSync(`cd ${config.zettelkasten_mcp_path} && .venv/bin/python -m zettelkasten_mcp.main`, { stdio: "ignore" });
        } catch (e) {
          api.notify("warn", "Zettelkasten MCP indexing failed, but session wrap continued.");
        }

        // 6. Unified Memory Sync (Beads)
        try {
          execSync("bd sync", { stdio: "ignore" });
        } catch (e) {
          // Ignore if bd command doesn't exist
        }

        api.notify("success", "Session Secured: Internal, External, and Zettelkasten systems synced.");
        api.setStatus("success", "Session Wrap Complete");

      } catch (error: any) {
        api.notify("error", `Session Wrap failed: ${error.message}`);
        api.setStatus("error", "Session Wrap Failed");
      }
    },
  });
}
