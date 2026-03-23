/**
 * Sentry Example — Demonstrates error tracking in Pi extensions
 *
 * This is a lightweight example using Sentry's HTTP API directly.
 * For production use, load sentry.ts as middleware instead.
 *
 * Usage: pi -e extensions/sentry-example.ts -e extensions/minimal.ts
 *
 * Commands:
 *   /sentry-test      — Trigger a test error
 *   /sentry-message   — Capture a test message
 *   /sentry-status    — Check Sentry configuration
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { applyExtensionDefaults } from "./themeMap.ts";

interface SentryOptions {
	dsn?: string;
	environment?: string;
	release?: string;
	valid: boolean;
}

let options: SentryOptions = { valid: false };

function validateDsn(dsn: string | undefined): { dsn: string | undefined; valid: boolean } {
	if (!dsn) return { dsn: undefined, valid: false };

	const placeholderPatterns = ["https://...", "http://...", "YOUR_", "your-"];
	for (const pattern of placeholderPatterns) {
		if (dsn.includes(pattern)) return { dsn: undefined, valid: false };
	}

	try {
		const url = new URL(dsn);
		if (!url.username || url.username.length < 5) return { dsn: undefined, valid: false };
		return { dsn, valid: true };
	} catch {
		return { dsn: undefined, valid: false };
	}
}

export default function (pi: ExtensionAPI) {
	const validation = validateDsn(process.env.SENTRY_DSN);
	options = {
		dsn: validation.dsn,
		environment: process.env.NODE_ENV || "development",
		release: process.env.SENTRY_RELEASE || "pi-agent@1.0.0",
		valid: validation.valid,
	};

	// Register commands (always, regardless of DSN validity)
	pi.registerCommand("sentry-test", {
		description: "Trigger a test error to verify Sentry integration",
		handler: async (_args, ctx) => {
			if (!options.valid) {
				ctx.ui.notify("Sentry: DSN not configured or invalid. Check .env", "warning");
				return;
			}
			try {
				throw new Error("This is a test error from sentry-example extension");
			} catch (err) {
				captureException(err as Error, { command: "sentry-test", extension: "sentry-example" });
				ctx.ui.notify("Test error captured (check Sentry dashboard)", "info");
			}
		},
	});

	pi.registerCommand("sentry-message", {
		description: "Capture a test message to Sentry",
		handler: async (_args, ctx) => {
			if (!options.valid) {
				ctx.ui.notify("Sentry: DSN not configured or invalid", "warning");
				return;
			}
			captureMessage("Test message from sentry_example extension", "info");
			ctx.ui.notify("Test message captured", "info");
		},
	});

	pi.registerCommand("sentry-status", {
		description: "Check Sentry configuration status",
		handler: async (_args, ctx) => {
			if (!options.dsn) {
				ctx.ui.notify("Sentry: Not configured. Add SENTRY_DSN to .env", "warning");
				return;
			}
			if (!options.valid) {
				ctx.ui.notify("Sentry: Invalid DSN format", "error");
				return;
			}
			ctx.ui.notify(
				`Sentry: Connected | ${maskDsn(options.dsn)} | Env: ${options.environment}`,
				"success",
			);
		},
	});

	// Session start notification
	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);

		if (!options.dsn) {
			ctx.ui.notify("Sentry: No DSN (add SENTRY_DSN to .env)", "warning");
		} else if (!options.valid) {
			ctx.ui.notify("Sentry: Invalid DSN format. Check .env", "error");
		} else {
			ctx.ui.notify(`Sentry: Enabled (${maskDsn(options.dsn)})`, "info");
		}
	});

	// Auto-capture errors if DSN is valid
	if (!options.valid) return;

	pi.on("tool_execution_error", (event) => {
		const error = event.error || new Error(String(event));
		captureException(error, { tool: event.toolName });
	});

	pi.on("command_error", (event) => {
		const error = event.error || new Error(String(event));
		captureException(error, { command: event.command });
	});
}

// ── Sentry HTTP API ───────────────────────────────────────────────────

function captureException(error: Error, extra?: Record<string, string>): void {
	if (!options.valid || !options.dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level: "error",
		logger: "pi-agent-example",
		platform: "other",
		server_name: "pi-agent",
		environment: options.environment,
		release: options.release,
		exception: [{
			type: error.name || "Error",
			value: error.message,
			stacktrace: error.stack ? parseStackTrace(error.stack) : undefined,
		}],
		extra,
	};

	sendToSentry(event);
}

function captureMessage(message: string, level: string = "info"): void {
	if (!options.valid || !options.dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level,
		logger: "pi-agent-example",
		platform: "other",
		server_name: "pi-agent",
		message,
		environment: options.environment,
		release: options.release,
	};

	sendToSentry(event);
}

function sendToSentry(event: Record<string, unknown>): void {
	if (!options.valid || !options.dsn) return;

	try {
		const url = new URL(options.dsn);
		const projectId = url.pathname.replace("/", "");
		const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${url.username}`;

		fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(event),
		}).catch(() => {});
	} catch {}
}

function parseStackTrace(stack: string): { frames: Array<{ filename: string; function: string; lineno: number }> } {
	const lines = stack.split("\n").slice(1);
	const frames = lines.slice(0, 10).map((line) => {
		const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
		if (match) {
			return {
				function: match[1] || "unknown",
				filename: match[2] || "unknown",
				lineno: parseInt(match[3], 10) || 0,
			};
		}
		const simpleMatch = line.match(/at\s+(.+)/);
		return {
			function: simpleMatch ? simpleMatch[1].trim() : "unknown",
			filename: "unknown",
			lineno: 0,
		};
	});

	return { frames };
}

function maskDsn(dsn: string): string {
	try {
		const url = new URL(dsn);
		return `${url.protocol}//${url.username?.substring(0, 4) || ""}***@${url.host}`;
	} catch {
		return "***";
	}
}

function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0;
		return v.toString(16);
	});
}
