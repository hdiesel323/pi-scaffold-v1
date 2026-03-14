/**
 * Sentry Example — Demonstrates error tracking in Pi extensions
 *
 * This extension demonstrates using Sentry for error tracking.
 * For production, use extensions/sentry.ts instead (load FIRST).
 *
 * Usage: pi -e extensions/sentry-example.ts
 *
 * Commands:
 *   /sentry-test      — Trigger a test error
 *   /sentry-message   — Capture a test message
 *   /sentry-status    — Check Sentry configuration
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	// Check if Sentry is configured
	const dsn = process.env.SENTRY_DSN;

	if (!dsn) {
		pi.ui.notify("Sentry: No DSN configured (set SENTRY_DSN)", "warning");
		return;
	}

	pi.ui.notify("Sentry: Ready (use sentry.ts as middleware for full error capture)", "info");

	// Register /sentry-test command
	pi.registerCommand("sentry-test", {
		description: "Trigger a test error to verify Sentry integration",
		handler: async () => {
			try {
				throw new Error("This is a test error from sentry-example");
			} catch (err) {
				const error = err as Error;
				await captureToSentry(error, { source: "sentry-example" });
				pi.ui.notify("Test error captured (check Sentry dashboard)", "info");
			}
		},
	});

	// Register /sentry-message command
	pi.registerCommand("sentry-message", {
		description: "Capture a test message to Sentry",
		handler: async () => {
			await sendMessageToSentry("Test message from Pi extension", "info");
			pi.ui.notify("Test message captured", "info");
		},
	});

	// Register /sentry-status command
	pi.registerCommand("sentry-status", {
		description: "Check Sentry configuration",
		handler: async () => {
			const masked = dsn.replace(/@.*?\./, "@***.");
			pi.ui.notify(`Sentry: DSN configured (${masked})`, "success");
		},
	});
}

// ── Sentry HTTP API (lightweight) ─────────────────────────────────

async function captureToSentry(error: Error, extra?: Record<string, string>): Promise<void> {
	const dsn = process.env.SENTRY_DSN;
	if (!dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level: "error",
		logger: "pi-agent",
		platform: "other",
		server_name: "pi-agent",
		environment: process.env.NODE_ENV || "development",
		release: process.env.SENTRY_RELEASE || "pi-agent@1.0.0",
		exception: {
			values: [{
				type: error.name || "Error",
				value: error.message,
				stacktrace: error.stack ? parseStackTrace(error.stack) : undefined,
			}],
		},
		extra,
	};

	await sendToSentry(dsn, event);
}

async function sendMessageToSentry(message: string, level: string): Promise<void> {
	const dsn = process.env.SENTRY_DSN;
	if (!dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level,
		logger: "pi-agent",
		platform: "other",
		server_name: "pi-agent",
		environment: process.env.NODE_ENV || "development",
		release: process.env.SENTRY_RELEASE || "pi-agent@1.0.0",
		message,
	};

	await sendToSentry(dsn, event);
}

async function sendToSentry(dsn: string, event: Record<string, unknown>): Promise<void> {
	try {
		const url = new URL(dsn);
		const projectId = url.pathname.replace("/", "");
		const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${url.username}`;

		await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(event),
		});
	} catch {}
}

function parseStackTrace(stack: string): { frames: Array<{ filename: string; function: string; lineno: number }> } {
	const lines = stack.split("\n").slice(1);
	return {
		frames: lines.slice(0, 10).map((line) => {
			const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
			if (match) {
				return { function: match[1], filename: match[2], lineno: parseInt(match[3]) };
			}
			const simpleMatch = line.match(/at\s+(.+)/);
			return { function: simpleMatch ? simpleMatch[1].trim() : "unknown", filename: "unknown", lineno: 0 };
		}),
	};
}

function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		return (c === "x" ? r : (r & 0x3) | 0).toString(16);
	});
}
