/**
 * Pi Swarm — Session Wrap Extension
 * License: MIT
 * Copyright (c) 2026 Pi Swarm Maintainers
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import * as yaml from "js-yaml";
import { applyExtensionDefaults } from "./themeMap.ts";

interface WrapConfig {
	external_vault_path: string;
	archive_logs_path: string;
	zettelkasten_mcp_path: string;
}

function resolveConfiguredPath(projectRoot: string, configuredPath: string): string {
	return path.isAbsolute(configuredPath) ? configuredPath : path.resolve(projectRoot, configuredPath);
}

function resolveKnowledgeBasePath(projectRoot: string): string {
	const canonicalPath = path.join(projectRoot, "docs", "ZETTELKASTEN.md");
	if (fs.existsSync(canonicalPath)) {
		return canonicalPath;
	}

	const legacyPath = path.join(projectRoot, "docs", "ZETTELGHEST.md");
	if (fs.existsSync(legacyPath)) {
		return legacyPath;
	}

	throw new Error("docs/ZETTELKASTEN.md not found");
}

function readWrapConfig(configPath: string): WrapConfig {
	const raw = fs.readFileSync(configPath, "utf-8");
	const parsed = yaml.load(raw) as Partial<WrapConfig> | undefined;

	if (!parsed?.external_vault_path || !parsed?.archive_logs_path || !parsed?.zettelkasten_mcp_path) {
		throw new Error("Invalid .pi/wrap-config.yaml: missing required paths");
	}

	return parsed as WrapConfig;
}

function refreshKnowledgeBase(zettelPath: string, agentsCount: number, extensionNames: string[]): void {
	if (!fs.existsSync(zettelPath)) {
		throw new Error("Knowledge base file not found");
	}

	const current = fs.readFileSync(zettelPath, "utf-8");
	const withUpdatedCount = current
		.replace(/\(\d+\s+Agents\)/, `(${agentsCount} Agents)`)
		.replace(/Agents \(\d+\)/, `Agents (${agentsCount})`);
	const sectionMatch = withUpdatedCount.match(
		/(## 🔌 Power Suite Extensions\s*\n)([\s\S]*?)(\n## |\n---|\s*$)/,
	);

	if (!sectionMatch || extensionNames.length === 0) {
		fs.writeFileSync(zettelPath, withUpdatedCount);
		return;
	}

	const [, heading, existingSection, suffix] = sectionMatch;
	const existingDescriptions = new Map<string, string>();
	for (const line of existingSection.split("\n")) {
		const match = line.match(/^- `([^`]+)`(?::\s*(.*))?$/);
		if (match?.[1]) {
			existingDescriptions.set(match[1], match[2] ?? "");
		}
	}

	const extensionSection = extensionNames
		.map((name) => {
			const description = existingDescriptions.get(name);
			return description ? `- \`${name}\`: ${description}` : `- \`${name}\``;
		})
		.join("\n");
	const updated = withUpdatedCount.replace(
		/(## 🔌 Power Suite Extensions\s*\n)([\s\S]*?)(\n## |\n---|\s*$)/,
		`${heading}${extensionSection}\n\n${suffix}`,
	);

	fs.writeFileSync(zettelPath, updated);
}

export default function(api: ExtensionAPI) {
	api.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
	});

	api.registerCommand("wrap", {
		description: "Automate project closure and knowledge synchronization.",
		handler: async (args, ctx) => {
			const summary = args.trim();
			if (!summary) {
				ctx.ui.notify("Usage: /wrap <summary>", "warning");
				return;
			}

			const timestamp = new Date().toISOString();
			const wrapConfigPath = path.join(ctx.cwd, ".pi/wrap-config.yaml");

			if (!fs.existsSync(wrapConfigPath)) {
				ctx.ui.notify("Session Wrap configuration not found at .pi/wrap-config.yaml", "error");
				return;
			}

			try {
				const config = readWrapConfig(wrapConfigPath);
				const externalVaultPath = resolveConfiguredPath(ctx.cwd, config.external_vault_path);
				const archiveLogsPath = resolveConfiguredPath(ctx.cwd, config.archive_logs_path);
				const zettelkastenMcpPath = resolveConfiguredPath(ctx.cwd, config.zettelkasten_mcp_path);
				ctx.ui.setStatus("session-wrap", "Starting Session Wrap...");

				const transitionPath = path.join(ctx.cwd, "docs/TRANSITION.md");
				if (!fs.existsSync(transitionPath)) {
					throw new Error("docs/TRANSITION.md not found");
				}
				fs.appendFileSync(transitionPath, `\n\n### Session Wrap: ${timestamp}\n- **Summary**: ${summary}\n`);

				const zettelPath = resolveKnowledgeBasePath(ctx.cwd);
				const agentsDir = path.join(ctx.cwd, ".pi/agents");
				const extensionDir = path.join(ctx.cwd, "extensions");
				const agentsCount = fs.existsSync(agentsDir)
					? fs.readdirSync(agentsDir, { recursive: true }).filter((file) => String(file).endsWith(".md")).length
					: 0;
				const extensionNames = fs.existsSync(extensionDir)
					? fs.readdirSync(extensionDir).filter(
						(file) => String(file).endsWith(".ts") && String(file) !== "themeMap.ts",
					).map((file) => path.basename(String(file), ".ts")).sort()
					: [];

				refreshKnowledgeBase(zettelPath, agentsCount, extensionNames);

				if (!fs.existsSync(externalVaultPath)) {
					fs.mkdirSync(externalVaultPath, { recursive: true });
				}
				fs.copyFileSync(transitionPath, path.join(externalVaultPath, "TRANSITION.md"));
				fs.copyFileSync(zettelPath, path.join(externalVaultPath, "ZETTELKASTEN.md"));
				fs.copyFileSync(zettelPath, path.join(externalVaultPath, "ZETTELGHEST.md"));

				if (!fs.existsSync(archiveLogsPath)) {
					fs.mkdirSync(archiveLogsPath, { recursive: true });
				}
				const logName = `session-${timestamp.replace(/[:.]/g, "-")}.md`;
				const modifiedFiles = execSync("find . -maxdepth 3 -not -path '*/.*' -mtime -1", {
					cwd: ctx.cwd,
				}).toString();
				const logContent = `# Session Log: ${timestamp}\n\n## Summary\n${summary}\n\n## Modified Files (24h)\n\`\`\`\n${modifiedFiles}\n\`\`\``;
				fs.writeFileSync(path.join(archiveLogsPath, logName), logContent);

				try {
					ctx.ui.setStatus("session-wrap", "Indexing Zettelkasten...");
					execSync(".venv/bin/python -m zettelkasten_mcp.main", {
						cwd: zettelkastenMcpPath,
						stdio: "ignore",
					});
				} catch {
					ctx.ui.notify("Zettelkasten MCP indexing failed, but session wrap continued.", "warning");
				}

				try {
					execSync("bd sync", { cwd: ctx.cwd, stdio: "ignore" });
				} catch {
					// Ignore if bd command doesn't exist.
				}

				ctx.ui.notify("Session Secured: Internal, External, and Zettelkasten systems synced.", "info");
				ctx.ui.setStatus("session-wrap", "Session Wrap Complete");
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Session Wrap failed: ${message}`, "error");
				ctx.ui.setStatus("session-wrap", "Session Wrap Failed");
			}
		},
	});
}
