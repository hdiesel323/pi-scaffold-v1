/**
 * Health Check — System status monitoring with Sentry integration
 *
 * Provides /health command to check system status, API keys, and Sentry connectivity.
 *
 * Usage: pi -e extensions/health-check.ts
 *
 * Commands:
 *   /health              — Full system health check
 *   /health api          — Check API key configuration
 *   /health sentry       — Check Sentry status
 *   /health env          — Show environment variables (masked)
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { applyExtensionDefaults } from "./themeMap.ts";

interface HealthStatus {
	ok: boolean;
	label: string;
	details: string;
}

export default function (pi: ExtensionAPI) {
	// ── Health Check Functions ───────────────────────────────────────────────

	function checkApiKeys(): HealthStatus {
		const keys = [
			{ name: "OPENAI_API_KEY", env: process.env.OPENAI_API_KEY },
			{ name: "ANTHROPIC_API_KEY", env: process.env.ANTHROPIC_API_KEY },
			{ name: "GEMINI_API_KEY", env: process.env.GEMINI_API_KEY },
			{ name: "OPENROUTER_API_KEY", env: process.env.OPENROUTER_API_KEY },
		];

		const configured = keys.filter((k) => k.env && k.env.length > 10);

		if (configured.length === 0) {
			return {
				ok: false,
				label: "API Keys",
				details: "No API keys configured",
			};
		}

		return {
			ok: true,
			label: "API Keys",
			details: `${configured.length}/${keys.length} configured: ${configured.map((k) => k.name).join(", ")}`,
		};
	}

	function checkSentry(): HealthStatus {
		const dsn = process.env.SENTRY_DSN;
		const org = process.env.SENTRY_ORG;
		const project = process.env.SENTRY_PROJECT;

		if (!dsn) {
			return {
				ok: false,
				label: "Sentry",
				details: "No DSN configured (set SENTRY_DSN)",
			};
		}

		const maskedDsn = maskDsn(dsn);
		const configParts = [];
		if (org) configParts.push(`org: ${org}`);
		if (project) configParts.push(`project: ${project}`);

		return {
			ok: true,
			label: "Sentry",
			details: `DSN: ${maskedDsn}${configParts.length > 0 ? " | " + configParts.join(" | ") : ""}`,
		};
	}

	function checkEnvironment(): HealthStatus {
		const env = process.env.NODE_ENV || "development";
		const hasDotenv = checkFileExists(".env");

		return {
			ok: true,
			label: "Environment",
			details: `${env} | .env file: ${hasDotenv ? "found" : "not found"}`,
		};
	}

	function checkDependencies(): HealthStatus {
		try {
			const hasBunModules = checkFileExists("node_modules");
			const hasPackageJson = checkFileExists("package.json");

			if (!hasPackageJson) {
				return {
					ok: false,
					label: "Dependencies",
					details: "package.json not found",
				};
			}

			return {
				ok: true,
				label: "Dependencies",
				details: hasBunModules ? "bun install completed" : "run 'bun install'",
			};
		} catch {
			return {
				ok: false,
				label: "Dependencies",
				details: "Unable to check",
			};
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────

	function maskDsn(dsn: string): string {
		try {
			const url = new URL(dsn);
			if (url.username) {
				return `${url.protocol}//${url.username.substring(0, 4)}***@${url.host}`;
			}
			return dsn;
		} catch {
			return "***";
		}
	}

	function checkFileExists(path: string): boolean {
		try {
			const fs = require("node:fs");
			fs.statSync(path);
			return true;
		} catch {
			return false;
		}
	}

	// ── Commands ──────────────────────────────────────────────────────────

	pi.registerCommand("health", {
		description: "System health check: /health [api|sentry|env]",
		getArgumentCompletions: () => [
			{ value: "api", label: "Check API keys" },
			{ value: "sentry", label: "Check Sentry status" },
			{ value: "env", label: "Show environment" },
		],
		handler: async (args, ctx) => {
			const arg = args?.trim().toLowerCase();

			const checks: HealthStatus[] = [];

			if (arg === "api" || !arg) {
				checks.push(checkApiKeys());
			}
			if (arg === "sentry" || !arg) {
				checks.push(checkSentry());
			}
			if (arg === "env" || !arg) {
				checks.push(checkEnvironment());
			}
			if (!arg) {
				checks.push(checkDependencies());
			}

			// Display results
			if (arg) {
				// Single check - show directly
				const check = checks[0];
				ctx.ui.notify(
					`${check.ok ? "✅" : "❌"} ${check.label}: ${check.details}`,
					check.ok ? "info" : "warning",
				);
			} else {
				// Full check - show summary
				const summary = checks
					.map((c) => `${c.ok ? "✅" : "❌"} ${c.label}: ${c.details}`)
					.join("\n");
				const okCount = checks.filter((c) => c.ok).length;
				const total = checks.length;

				ctx.ui.notify(
					`Health: ${okCount}/${total} checks passed\n\n${summary}`,
					okCount === total ? "success" : okCount > total / 2 ? "warning" : "error",
				);
			}
		},
	});

	// ── Status line + startup notify ──────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		ctx.ui.setStatus("health", "🟢");
		ctx.ui.notify("Health check loaded. Use /health for full report", "info");
	});
}
