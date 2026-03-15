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
 *   SENTRY_DSN=https://abc123@o4507818.ingest.us.sentry.io/4507818000000000
 *   SENTRY_ORG=your-org
 *   SENTRY_PROJECT=your-project
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface SentryOptions {
	dsn?: string;
	environment?: string;
	release?: string;
	valid: boolean;
}

let options: SentryOptions = { valid: false };

function validateDsn(dsn: string | undefined): { dsn: string | undefined; valid: boolean } {
	if (!dsn) return { dsn: undefined, valid: false };

	// Check for placeholder patterns
	const placeholderPatterns = [
		"https://...",
		"http://...",
		"YOUR_",
		"your-",
		".sentry.io/",
	];

	for (const pattern of placeholderPatterns) {
		if (dsn.includes(pattern)) {
			return { dsn: undefined, valid: false };
		}
	}

	// Try to parse as URL
	try {
		const url = new URL(dsn);
		// Must have a username (the API key) and a valid hostname
		if (!url.username || url.username.length < 5) {
			return { dsn: undefined, valid: false };
		}
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

	// ── Register commands ALWAYS (even without valid DSN) ─────────────────────

	pi.registerCommand("sentry-test", {
		description: "Test Sentry by triggering a captured error",
		handler: async (_args, ctx) => {
			if (!options.valid) {
				ctx.ui.notify("Sentry: DSN not configured or invalid. Check .env", "warning");
				return;
			}
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
			if (!options.valid) {
				ctx.ui.notify("Sentry: DSN not configured or invalid. Check .env", "warning");
				return;
			}
			captureMessage("Test message from Pi extension", "info");
			ctx.ui.notify("Test message sent to Sentry", "info");
		},
	});

	pi.registerCommand("sentry-status", {
		description: "Show Sentry connection status",
		handler: async (_args, ctx) => {
			if (!options.dsn) {
				ctx.ui.notify("Sentry: Not configured. Add valid SENTRY_DSN to .env", "warning");
				return;
			}
			if (!options.valid) {
				ctx.ui.notify("Sentry: Invalid DSN. Check format: https://key@host/project", "error");
				return;
			}
			ctx.ui.notify(
				`Sentry: Connected | ${maskDsn(options.dsn)} | Env: ${options.environment}`,
				"success",
			);
		},
	});

	pi.registerCommand("sentry-set-dsn", {
		description: "Set Sentry DSN for this session: /sentry-set-dsn <dsn>",
		handler: async (args, ctx) => {
			if (!args) {
				ctx.ui.notify("Usage: /sentry-set-dsn https://key@host/project", "warning");
				return;
			}
			const validation = validateDsn(args.trim());
			if (!validation.valid) {
				ctx.ui.notify("Invalid DSN format. Expected: https://key@host/project", "error");
				return;
			}
			options.dsn = validation.dsn;
			options.valid = true;
			ctx.ui.notify(`Sentry: DSN set to ${maskDsn(options.dsn!)}`, "success");
		},
	});

	// ── Session start notification ─────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		if (!options.dsn) {
			ctx.ui.notify("Sentry: No DSN (add SENTRY_DSN to .env)", "warning");
		} else if (!options.valid) {
			ctx.ui.notify("Sentry: Invalid DSN format. Check .env", "error");
		} else {
			ctx.ui.notify(`Sentry: Enabled (${maskDsn(options.dsn)})`, "info");
		}
	});

	// ── Early return if no valid DSN ───────────────────────────────────────

	if (!options.valid) return;

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
}

// ── Sentry HTTP API ───────────────────────────────────────────────────

function captureException(error: Error, extra?: Record<string, string>): void {
	if (!options.valid || !options.dsn) return;

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
	if (!options.valid || !options.dsn) return;

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
	if (!options.valid || !options.dsn) return;

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
