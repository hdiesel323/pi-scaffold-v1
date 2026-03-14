/**
 * Sentry Integration Module
 *
 * Provides error tracking and performance monitoring for Pi extensions.
 *
 * Usage in extensions:
 *   import { initSentry, captureError, captureMessage } from "./lib/sentry.ts";
 *
 *   export default function (pi: ExtensionAPI) {
 *     initSentry(pi, {
 *       dsn: process.env.SENTRY_DSN,
 *       environment: process.env.NODE_ENV || "development",
 *     });
 *     // ... rest of extension
 *   }
 */

import * as Sentry from "@sentry/node";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export interface SentryConfig {
	dsn?: string;
	environment?: string;
	release?: string;
	_sampleRate?: number;
	tracesSampleRate?: number;
}

let initialized = false;
let currentDsn: string | undefined;

export function initSentry(pi: ExtensionAPI, config: SentryConfig): void {
	if (initialized) return;

	const dsn = config.dsn || process.env.SENTRY_DSN;

	if (!dsn) {
		pi.registerCommand("sentry-status", {
			description: "Check Sentry status",
			handler: async () => {
				pi.getUI().notify("Sentry: No DSN configured (set SENTRY_DSN)", "warning");
			},
		});
		return;
	}

	currentDsn = dsn;

	Sentry.init({
		dsn,
		environment: config.environment || "development",
		release: config.release || `pi-extensions@${getVersion()}`,
		integrations: [
			Sentry.httpIntegration(),
			Sentry.onUncaughtExceptionIntegration(),
			Sentry.onUnhandledRejectionIntegration(),
		],
		sampleRate: config._sampleRate || 0.1,
		tracesSampleRate: config.tracesSampleRate || 0.1,
		beforeSend(event) {
			// Filter out non-error events
			if (event.type === "transaction") {
				return event;
			}
			if (!event.exception) {
				return null;
			}
			return event;
		},
	});

	initialized = true;

	// Register /sentry-status command
	pi.registerCommand("sentry-status", {
		description: "Check Sentry status and configuration",
		handler: async () => {
			const status = {
				initialized: Sentry.getCurrentHub().getClient()?.getOptions() ? true : false,
				dsn: currentDsn ? maskDsn(currentDsn) : "not configured",
				environment: Sentry.getCurrentHub().getClient()?.getOptions()?.environment || "unknown",
			};
			pi.getUI().notify(
				`Sentry: ${status.initialized ? "connected" : "disconnected"} | DSN: ${status.dsn} | Env: ${status.environment}`,
				status.initialized ? "info" : "warning",
			);
		},
	});

	pi.getUI().notify(`Sentry: Initialized (${maskDsn(dsn)})`, "info");
}

function getVersion(): string {
	try {
		const pkg = JSON.parse(Deno.readTextFileSync("package.json"));
		return pkg.version || "0.0.0";
	} catch {
		return "0.0.0";
	}
}

function maskDsn(dsn: string): string {
	try {
		const url = new URL(dsn);
		if (url.username) {
			return `${url.protocol}//${url.username.substring(0, 4)}***@${url.host}${url.pathname}`;
		}
		return dsn;
	} catch {
		return "***";
	}
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
	if (!initialized) return;

	Sentry.withScope((scope) => {
		if (context) {
			scope.setExtra("context", context);
		}
		Sentry.captureException(error);
	});
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info"): void {
	if (!initialized) return;

	Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string }): void {
	if (!initialized) return;
	Sentry.setUser(user);
}

export function addBreadcrumb(breadcrumb: {
	category?: string;
	message?: string;
	level?: Sentry.SeverityLevel;
	data?: Record<string, unknown>;
}): void {
	if (!initialized) return;
	Sentry.addBreadcrumb(breadcrumb);
}

export function getTransaction(): Sentry.Transaction | undefined {
	const hub = Sentry.getCurrentHub();
	return hub.getScope()?.getTransaction();
}

export function startSpan<T>(
	options: Sentry.StartSpanOptions,
	callback: (span: Sentry.Span) => T,
): T {
	return Sentry.startSpan(options, callback);
}

export function isInitialized(): boolean {
	return initialized;
}
