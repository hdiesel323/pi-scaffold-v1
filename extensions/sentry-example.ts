/**
 * Sentry Example — Demonstrates error tracking in Pi extensions
 *
 * Usage: pi -e extensions/sentry-example.ts
 *
 * Commands:
 *   /sentry-test      — Trigger a test error
 *   /sentry-message   — Capture a test message
 *   /sentry-status    — Check Sentry configuration
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { initSentry, captureError, captureMessage } from "../lib/sentry.ts";

export default function (pi: ExtensionAPI) {
	// Initialize Sentry with environment variables
	initSentry(pi, {
		environment: process.env.NODE_ENV || "development",
	});

	// Register /sentry-test command
	pi.registerCommand("sentry-test", {
		description: "Trigger a test error to verify Sentry integration",
		handler: async () => {
			try {
				// Intentionally throw an error
				throw new Error("This is a test error from sentry-example extension");
			} catch (err) {
				captureError(err as Error, {
					command: "sentry-test",
					extension: "sentry-example",
				});
				pi.getUI().notify("Test error captured (check Sentry dashboard)", "info");
			}
		},
	});

	// Register /sentry-message command
	pi.registerCommand("sentry-message", {
		description: "Capture a test message to Sentry",
		handler: async () => {
			captureMessage("Test message from sentry-example extension", "info");
			pi.getUI().notify("Test message captured", "info");
		},
	});

	// Auto-capture unhandled errors
	pi.on("error", (event, ctx) => {
		captureError(event.error || new Error(String(event)), {
			phase: event.phase,
			toolName: event.toolName,
		});
	});

	pi.getUI().notify(
		"Sentry example loaded. Use /sentry-test, /sentry-message, or /sentry-status",
		"info",
	);
}
