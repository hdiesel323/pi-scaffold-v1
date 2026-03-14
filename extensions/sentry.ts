/**
 * Sentry Middleware — Auto-initialize Sentry for all extensions
 *
 * Load this FIRST in your extension stack to enable error tracking:
 *   pi -e extensions/sentry.ts -e extensions/other-extension.ts
 *
 * Automatically captures:
 * - Uncaught exceptions
 * - Unhandled promise rejections
 * - Tool execution errors
 * - Command errors
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as Sentry from "@sentry/node";

interface SentryOptions {
	dsn?: string;
	environment?: string;
	release?: string;
	sampleRate?: number;
	tracesSampleRate?: number;
}

let initialized = false;

export default function (pi: ExtensionAPI) {
	const options: SentryOptions = {
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV || "development",
		release: process.env.SENTRY_RELEASE,
		sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || "0.1"),
		tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
	};

	// Don't initialize without DSN
	if (!options.dsn) {
		pi.getUI().notify("Sentry: No DSN (set SENTRY_DSN in .env)", "warning");
		return;
	}

	// Initialize Sentry
	Sentry.init({
		dsn: options.dsn,
		environment: options.environment,
		release: options.release,
		sampleRate: options.sampleRate,
		tracesSampleRate: options.tracesSampleRate,
		integrations: (integrations) => {
			return integrations.filter((integration) => {
				// Filter to only Node.js-relevant integrations
				return [
					"SentryCore",
					"Http",
					"OnUncaughtException",
					"OnUnhandledRejection",
				].some((name) => integration.name.includes(name));
			});
		},
		beforeSend(event) {
			// Skip transaction events
			if (event.type === "transaction") return event;
			// Skip events without exceptions
			if (!event.exception) return null;
			return event;
		},
	});

	initialized = true;

	pi.getUI().notify(
		`Sentry: Enabled (${maskDsn(options.dsn)})`,
		"info",
	);

	// ── Error Capture Hooks ────────────────────────────────────────────────

	// Capture tool execution errors
	pi.on("tool_execution_error", (event) => {
		Sentry.captureException(event.error || new Error(String(event)), {
			extra: {
				tool: event.toolName,
				input: event.input,
			},
			level: "error",
		});
	});

	// Capture command errors
	pi.on("command_error", (event) => {
		Sentry.captureException(event.error || new Error(String(event)), {
			extra: {
				command: event.command,
			},
			level: "error",
		});
	});

	// Capture agent errors
	pi.on("agent_error", (event) => {
		Sentry.captureException(event.error || new Error(String(event)), {
			extra: {
				phase: event.phase,
			},
			level: "error",
		});
	});

	// ── Breadcrumb Hooks ───────────────────────────────────────────────────

	// Add tool calls as breadcrumbs
	pi.on("tool_execution_start", (event) => {
		Sentry.addBreadcrumb({
			category: "tool",
			message: event.toolName,
			level: "info",
			data: {
				input: truncate(JSON.stringify(event.input), 500),
			},
		});
	});

	// Add messages as breadcrumbs
	pi.on("message_update", (event) => {
		const delta = event.assistantMessageEvent;
		if (delta?.type === "text_delta" && delta.delta) {
			Sentry.addBreadcrumb({
				category: "message",
				message: truncate(delta.delta, 200),
				level: "info",
			});
		}
	});

	// ── Commands ───────────────────────────────────────────────────────────

	pi.registerCommand("sentry-test", {
		description: "Test Sentry by triggering a captured error",
		handler: async () => {
			try {
				throw new Error("Sentry test error");
			} catch (err) {
				Sentry.captureException(err);
				pi.getUI().notify("Test error sent to Sentry", "info");
			}
		},
	});

	pi.registerCommand("sentry-message", {
		description: "Send a test message to Sentry",
		handler: async () => {
			Sentry.captureMessage("Test message from Pi extension", "info");
			pi.getUI().notify("Test message sent to Sentry", "info");
		},
	});

	pi.registerCommand("sentry-status", {
		description: "Show Sentry connection status",
		handler: async () => {
			const client = Sentry.getCurrentHub().getClient();
			if (!client) {
				pi.getUI().notify("Sentry: Not initialized", "warning");
				return;
			}
			const opts = client.getOptions();
			pi.getUI().notify(
				`Sentry: Connected | Env: ${opts.environment} | Release: ${opts.release}`,
				"success",
			);
		},
	});

	pi.registerCommand("sentry-flush", {
		description: "Flush pending Sentry events",
		handler: async () => {
			await Sentry.flush(3000);
			pi.getUI().notify("Sentry: Events flushed", "info");
		},
	});
}

function maskDsn(dsn: string): string {
	try {
		const url = new URL(dsn);
		return `${url.protocol}//${url.username?.substring(0, 4) || ""}***@${url.host}`;
	} catch {
		return "***";
	}
}

function truncate(str: string, max: number): string {
	return str.length > max ? str.substring(0, max) + "..." : str;
}
