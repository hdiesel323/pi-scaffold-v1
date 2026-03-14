/**
 * Sentry Middleware — Lightweight error tracking without Sentry SDK
 *
 * Load this FIRST in your extension stack to enable error tracking:
 *   pi -e extensions/sentry.ts -e extensions/other-extension.ts
 *
 * Uses Sentry's HTTP API directly (no SDK required).
 * Automatically captures:
 * - Tool execution errors
 * - Command errors
 * - Agent errors
 *
 * Setup:
 *   SENTRY_DSN=https://...@sentry.io/123456
 *   SENTRY_ORG=your-org
 *   SENTRY_PROJECT=your-project
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface SentryOptions {
	dsn?: string;
	environment?: string;
	release?: string;
}

let initialized = false;
let options: SentryOptions = {};

export default function (pi: ExtensionAPI) {
	options = {
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV || "development",
		release: process.env.SENTRY_RELEASE || "pi-agent@1.0.0",
	};

	// ── Notify on session start ───────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		if (!options.dsn) {
			ctx.ui.notify("Sentry: No DSN (set SENTRY_DSN in .env)", "warning");
		} else {
			ctx.ui.notify(`Sentry: Enabled (${maskDsn(options.dsn)})`, "info");
		}
	});

	if (!options.dsn) return;

	initialized = true;

	// ── Error Capture Hooks ────────────────────────────────────────────────

	pi.on("tool_execution_error", (event) => {
		const error = event.error || new Error(String(event));
		captureException(error, {
			tool: event.toolName,
			input: JSON.stringify(event.input).substring(0, 500),
		});
	});

	pi.on("command_error", (event) => {
		const error = event.error || new Error(String(event));
		captureException(error, {
			command: event.command,
		});
	});

	pi.on("agent_error", (event) => {
		const error = event.error || new Error(String(event));
		captureException(error, {
			phase: event.phase,
		});
	});

	// ── Commands ─────────────────────────────────────────────────────────

	pi.registerCommand("sentry-test", {
		description: "Test Sentry by triggering a captured error",
		handler: async (_args, ctx) => {
			try {
				throw new Error("Sentry test error");
			} catch (err) {
				captureException(err as Error, { command: "sentry-test" });
				ctx.ui.notify("Test error sent to Sentry", "info");
			}
		},
	});

	pi.registerCommand("sentry-message", {
		description: "Send a test message to Sentry",
		handler: async (_args, ctx) => {
			captureMessage("Test message from Pi extension", "info");
			ctx.ui.notify("Test message sent to Sentry", "info");
		},
	});

	pi.registerCommand("sentry-status", {
		description: "Show Sentry connection status",
		handler: async (_args, ctx) => {
			if (!initialized) {
				ctx.ui.notify("Sentry: Not initialized", "warning");
				return;
			}
			ctx.ui.notify(
				`Sentry: Connected | Env: ${options.environment} | Release: ${options.release}`,
				"success",
			);
		},
	});

	pi.registerCommand("sentry-flush", {
		description: "Flush pending Sentry events",
		handler: async (_args, ctx) => {
			ctx.ui.notify("Sentry: Events sent synchronously", "info");
		},
	});
}

// ── Sentry HTTP API ───────────────────────────────────────────────────

function captureException(error: Error, extra?: Record<string, string>): void {
	if (!initialized || !options.dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level: "error",
		logger: "pi-agent",
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
	if (!initialized || !options.dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level,
		logger: "pi-agent",
		platform: "other",
		server_name: "pi-agent",
		message,
		environment: options.environment,
		release: options.release,
	};

	sendToSentry(event);
}

function sendToSentry(event: Record<string, unknown>): void {
	if (!options.dsn) return;

	try {
		const url = new URL(options.dsn);
		const projectId = url.pathname.replace("/", "");
		const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${url.username}`;

		fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(event),
		}).catch(() => {
			// Silent fail - don't disrupt the agent
		});
	} catch {
		// Silent fail
	}
}

function parseStackTrace(stack: string): { frames: Array<{ filename: string; function: string; lineno: number }> } {
	const lines = stack.split("\n").slice(1); // Skip Error message line
	const frames = lines.slice(0, 10).map((line) => {
		const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
		if (match) {
			return {
				function: match[1] || "unknown",
				filename: match[2] || "unknown",
				lineno: parseInt(match[3], 10) || 0,
			};
		}
		// Handle "at <anonymous>" format
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
