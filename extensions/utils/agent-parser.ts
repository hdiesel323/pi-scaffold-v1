/**
 * Shared agent definition parser utilities
 * Used by agent-team.ts, agent-chain.ts, pi-pi.ts
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";

// ── Types ────────────────────────────────────────

export interface AgentDef {
	name: string;
	description: string;
	tools: string;
	systemPrompt: string;
	file?: string; // Optional - only included when parsing for display purposes
}

// ── Parser ──────────────────────────────────────

export function parseAgentFile(filePath: string, includeFilePath = false): AgentDef | null {
	try {
		const raw = readFileSync(filePath, "utf-8");
		const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!match) return null;

		const frontmatter: Record<string, string> = {};
		for (const line of match[1].split("\n")) {
			const idx = line.indexOf(":");
			if (idx > 0) {
				frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
			}
		}

		if (!frontmatter.name) return null;

		const def: AgentDef = {
			name: frontmatter.name,
			description: frontmatter.description || "",
			tools: frontmatter.tools || "read,grep,find,ls",
			systemPrompt: match[2].trim(),
		};

		if (includeFilePath) {
			def.file = filePath;
		}

		return def;
	} catch (e) {
		console.error(`Failed to parse agent file ${filePath}:`, e instanceof Error ? e.message : e);
		return null;
	}
}

// ── Scanner (returns array) ──────────────────────

const DEFAULT_AGENT_DIRS = [
	"agents",
	".claude/agents",
	".pi/agents",
];

/**
 * Scan directories for agent definition files and return as an array.
 * Deduplicates by lowercase name.
 */
export function scanAgentDirs(
	cwd: string,
	dirs: string[] = DEFAULT_AGENT_DIRS,
	includeFilePath = false,
): AgentDef[] {
	const agents: AgentDef[] = [];
	const seen = new Set<string>();

	for (const dir of dirs) {
		const fullDir = join(cwd, ...dir.split("/"));
		if (!existsSync(fullDir)) continue;

		try {
			for (const file of readdirSync(fullDir)) {
				if (!file.endsWith(".md")) continue;
				const fullPath = resolve(fullDir, file);
				const def = parseAgentFile(fullPath, includeFilePath);
				if (!def) continue;

				const key = def.name.toLowerCase();
				if (seen.has(key)) continue;
				seen.add(key);
				agents.push(def);
			}
		} catch (e) {
			console.error(`Failed to scan directory ${fullDir}:`, e instanceof Error ? e.message : e);
		}
	}

	return agents;
}

/**
 * Scan directories for agent definition files and return as a Map.
 * Deduplicates by lowercase name.
 */
export function scanAgentDirsAsMap(cwd: string, dirs: string[] = DEFAULT_AGENT_DIRS): Map<string, AgentDef> {
	const agents = new Map<string, AgentDef>();
	const seen = new Set<string>();

	for (const dir of dirs) {
		const fullDir = join(cwd, ...dir.split("/"));
		if (!existsSync(fullDir)) continue;

		try {
			for (const file of readdirSync(fullDir)) {
				if (!file.endsWith(".md")) continue;
				const fullPath = resolve(fullDir, file);
				const def = parseAgentFile(fullPath);
				if (!def) continue;

				const key = def.name.toLowerCase();
				if (seen.has(key)) continue;
				seen.add(key);
				agents.set(key, def);
			}
		} catch (e) {
			console.error(`Failed to scan directory ${fullDir}:`, e instanceof Error ? e.message : e);
		}
	}

	return agents;
}

// ── Display Name Helper ──────────────────────────

export function displayName(name: string): string {
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
