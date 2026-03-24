/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

import { describe, it, expect } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sessionWrap from "../../extensions/session-wrap.ts";

describe("session-wrap extension", () => {
	it("registers the wrap command and applies default theme wiring on session start", async () => {
		let sessionStartHandler: ((event: unknown, ctx: any) => unknown) | undefined;
		let registeredCommand: { name: string; options: { handler: (args: string, ctx: any) => Promise<void> } } | undefined;

		const api: any = {
			on(event: string, handler: (event: unknown, ctx: any) => unknown) {
				if (event === "session_start") {
					sessionStartHandler = handler;
				}
			},
			registerCommand(name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) {
				expect(name).toBe("wrap");
				expect(typeof options.handler).toBe("function");
				registeredCommand = { name, options };
			},
		};

		sessionWrap(api);

		expect(registeredCommand).toBeDefined();
		expect(sessionStartHandler).toBeDefined();

		const themeCalls: string[] = [];
		const ctx: any = {
			hasUI: true,
			ui: {
				setTheme(theme: string) {
					themeCalls.push(theme);
					return { success: true };
				},
				setTitle() {},
			},
		};

		await sessionStartHandler?.({}, ctx);

		expect(themeCalls).toEqual(["synthwave"]);
	});

	it("uses ctx.ui for missing config errors", async () => {
		let commandHandler: ((args: string, ctx: any) => Promise<void>) | undefined;

		const api: any = {
			on() {},
			registerCommand(name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) {
				expect(name).toBe("wrap");
				commandHandler = options.handler;
			},
		};

		sessionWrap(api);

		const tempDir = mkdtempSync(join(tmpdir(), "pi-session-wrap-"));
		try {
			const notifications: Array<[string, string?]> = [];
			const ctx: any = {
				cwd: tempDir,
				ui: {
					notify(message: string, type?: string) {
						notifications.push([message, type]);
					},
					setStatus() {},
					setTheme() {
						return { success: true };
					},
					setTitle() {},
				},
			};

			await commandHandler?.("session summary", ctx);

			expect(notifications).toEqual([
				["Session Wrap configuration not found at .pi/wrap-config.yaml", "error"],
			]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("updates the knowledge base inventory without including helper files", async () => {
		let commandHandler: ((args: string, ctx: any) => Promise<void>) | undefined;

		const api: any = {
			on() {},
			registerCommand(name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) {
				expect(name).toBe("wrap");
				commandHandler = options.handler;
			},
		};

		sessionWrap(api);

		const tempDir = mkdtempSync(join(tmpdir(), "pi-session-wrap-full-"));
		const vaultDir = join(tempDir, "vault");
		const archiveDir = join(tempDir, "archive");
		const zettelkastenDir = join(tempDir, "zettelkasten");

		try {
			mkdirSync(join(tempDir, ".pi", "agents"), { recursive: true });
			mkdirSync(join(tempDir, "docs"), { recursive: true });
			mkdirSync(join(tempDir, "extensions"), { recursive: true });
			mkdirSync(zettelkastenDir, { recursive: true });

			writeFileSync(
				join(tempDir, ".pi", "wrap-config.yaml"),
				[
					`external_vault_path: "${vaultDir}"`,
					`archive_logs_path: "${archiveDir}"`,
					`zettelkasten_mcp_path: "${zettelkastenDir}"`,
				].join("\n"),
			);
			writeFileSync(join(tempDir, ".pi", "agents", "builder.md"), "---\nname: builder\n---\nPrompt");
			writeFileSync(join(tempDir, "extensions", "minimal.ts"), "export default {};\n");
			writeFileSync(join(tempDir, "extensions", "themeMap.ts"), "export {};\n");
			writeFileSync(join(tempDir, "docs", "TRANSITION.md"), "# Transition\n");
			writeFileSync(
				join(tempDir, "docs", "ZETTELKASTEN.md"),
				[
					"# ZETTELKASTEN",
					"",
					"## 👥 Agent Roster (0 Agents)",
					"",
					"## 🔌 Power Suite Extensions",
					"- `minimal`: Compact footer.",
					"- `themeMap`: Helper that should disappear.",
					"",
					"## 🚀 Launch Modes",
					"- `default`",
					"",
				].join("\n"),
			);

			const notifications: Array<[string, string?]> = [];
			const statuses: Array<[string, string | undefined]> = [];
			const ctx: any = {
				cwd: tempDir,
				ui: {
					notify(message: string, type?: string) {
						notifications.push([message, type]);
					},
					setStatus(key: string, value: string | undefined) {
						statuses.push([key, value]);
					},
					setTheme() {
						return { success: true };
					},
					setTitle() {},
				},
			};

			await commandHandler?.("completed release prep", ctx);

			const zettel = readFileSync(join(tempDir, "docs", "ZETTELKASTEN.md"), "utf-8");
			expect(zettel).toContain("## 👥 Agent Roster (1 Agents)");
			expect(zettel).toContain("- `minimal`: Compact footer.");
			expect(zettel).not.toContain("themeMap");
			expect(readFileSync(join(vaultDir, "ZETTELKASTEN.md"), "utf-8")).toContain("Compact footer.");
			expect(readFileSync(join(vaultDir, "ZETTELGHEST.md"), "utf-8")).toContain("Compact footer.");
			expect(notifications.some(([message]) => message.includes("Session Secured"))).toBe(true);
			expect(statuses.some(([key, value]) => key === "session-wrap" && value === "Session Wrap Complete")).toBe(true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("supports legacy ZETTELGHEST knowledge bases", async () => {
		let commandHandler: ((args: string, ctx: any) => Promise<void>) | undefined;

		const api: any = {
			on() {},
			registerCommand(_name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) {
				commandHandler = options.handler;
			},
		};

		sessionWrap(api);

		const tempDir = mkdtempSync(join(tmpdir(), "pi-session-wrap-legacy-"));

		try {
			mkdirSync(join(tempDir, ".pi"), { recursive: true });
			mkdirSync(join(tempDir, "docs"), { recursive: true });
			writeFileSync(
				join(tempDir, ".pi", "wrap-config.yaml"),
				[
					'external_vault_path: ".pi/sync/vault"',
					'archive_logs_path: ".pi/sync/archive"',
					'zettelkasten_mcp_path: ".pi/sync/mcp"',
				].join("\n"),
			);
			writeFileSync(join(tempDir, "docs", "TRANSITION.md"), "# Transition\n");
			writeFileSync(join(tempDir, "docs", "ZETTELGHEST.md"), "# Legacy\n\n## 🔌 Power Suite Extensions\n");

			const ctx: any = {
				cwd: tempDir,
				ui: {
					notify() {},
					setStatus() {},
					setTheme() {
						return { success: true };
					},
					setTitle() {},
				},
			};

			await commandHandler?.("legacy sync", ctx);

			expect(readFileSync(join(tempDir, "docs", "ZETTELGHEST.md"), "utf-8")).toContain("## 🔌 Power Suite Extensions");
			expect(readFileSync(join(tempDir, ".pi", "sync", "vault", "ZETTELKASTEN.md"), "utf-8")).toContain("# Legacy");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
