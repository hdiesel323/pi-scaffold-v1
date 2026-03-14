/**
 * Sentry Integration Module (Lightweight)
 *
 * Provides error tracking for Pi extensions via Sentry HTTP API.
 * No SDK required - uses fetch to send events directly.
 *
 * Usage:
 *   import { captureError, captureMessage } from "./lib/sentry.ts";
 */

interface SentryConfig {
	dsn?: string;
	environment?: string;
	release?: string;
}

let config: SentryConfig = {};
let initialized = false;

export function initSentry(config_: SentryConfig): void {
	config = config_;
	initialized = !!config.dsn;
}

export function isInitialized(): boolean {
	return initialized;
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
	if (!initialized || !config.dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level: "error",
		logger: "pi-agent",
		platform: "other",
		server_name: "pi-agent",
		environment: config.environment || "development",
		release: config.release || "pi-agent@1.0.0",
		exception: {
			values: [{
				type: error.name || "Error",
				value: error.message,
				stacktrace: error.stack ? parseStackTrace(error.stack) : undefined,
			}],
		},
		extra: context,
	};

	sendToSentry(event);
}

export function captureMessage(message: string, level: string = "info"): void {
	if (!initialized || !config.dsn) return;

	const event = {
		event_id: generateUUID(),
		timestamp: new Date().toISOString(),
		level,
		logger: "pi-agent",
		platform: "other",
		server_name: "pi-agent",
		environment: config.environment || "development",
		release: config.release || "pi-agent@1.0.0",
		message,
	};

	sendToSentry(event);
}

export function setUser(user: { id: string; email?: string; username?: string }): void {
	// Not implemented in lightweight version
}

export function addBreadcrumb(breadcrumb: {
	category?: string;
	message?: string;
	level?: string;
	data?: Record<string, unknown>;
}): void {
	// Not implemented in lightweight version
}

// ── Internal Helpers ─────────────────────────────────────────────

function sendToSentry(event: Record<string, unknown>): void {
	if (!config.dsn) return;

	try {
		const url = new URL(config.dsn);
		const projectId = url.pathname.replace("/", "");
		const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${url.username}`;

		fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
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

function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0;
		return v.toString(16);
	});
}
