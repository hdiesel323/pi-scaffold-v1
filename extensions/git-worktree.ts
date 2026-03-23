/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

/**
 * Git Worktree Extension
 * 
 * Enables seamless multi-tasking by managing Git worktrees.
 * 
 * Usage: pi -e extensions/git-worktree.ts
 * Commands: /wt-add <branch>, /wt-list, /wt-remove <path>, /wt-sync <path>
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";

export default function (pi: ExtensionAPI) {

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function runGit(command: string, ctx: ExtensionContext): string {
    try {
      return execSync(`git ${command}`, { cwd: ctx.cwd, encoding: "utf-8" }).trim();
    } catch (err: any) {
      throw new Error(`Git command failed: ${err.message}`);
    }
  }

  function updateFooter(ctx: ExtensionContext) {
    try {
      const branch = runGit("branch --show-current", ctx);
      const wtName = path.basename(ctx.cwd);
      
      ctx.ui.setFooter((_tui, theme) => ({
        dispose: () => {},
        invalidate: () => {},
        render: (width: number) => {
          const text = `🌿 ${branch} @ ${wtName}`;
          return [theme.fg("accent", ` ${text} `).padEnd(width)];
        }
      }));
    } catch (e) {}
  }

  // ─── Slash Commands ────────────────────────────────────────────────────────

  pi.registerCommand("wt-add", {
    description: "Create a new Git worktree: /wt-add <branch-name>",
    handler: async (args, ctx) => {
      const branch = args.trim();
      if (!branch) return ctx.ui.notify("Usage: /wt-add <branch>", "warning");

      const targetPath = path.resolve(ctx.cwd, `../${branch}`);
      ctx.ui.notify(`Creating worktree for ${branch}...`, "info");

      try {
        runGit(`worktree add ${targetPath} -b ${branch}`, ctx);
        ctx.ui.notify(`✅ Worktree created at ${targetPath}`, "success");
      } catch (err: any) {
        ctx.ui.notify(`Error: ${err.message}`, "error");
      }
    }
  });

  pi.registerCommand("wt-list", {
    description: "List all active worktrees.",
    handler: async (_args, ctx) => {
      try {
        const list = runGit("worktree list", ctx);
        ctx.ui.notify(`Git Worktrees:\n${list}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Error: ${err.message}`, "error");
      }
    }
  });

  pi.registerCommand("wt-sync", {
    description: "Move uncommitted changes to another worktree: /wt-sync <target-path>",
    handler: async (args, ctx) => {
      const target = args.trim();
      if (!target) return ctx.ui.notify("Usage: /wt-sync <target-path>", "warning");

      try {
        ctx.ui.notify("Stashing local changes...", "info");
        runGit("stash push -m 'pi-wt-sync'", ctx);
        
        const targetAbs = path.resolve(ctx.cwd, target);
        ctx.ui.notify(`Applying to ${target}...`, "info");
        
        execSync(`git stash apply`, { cwd: targetAbs });
        ctx.ui.notify("✅ Sync complete.", "success");
      } catch (err: any) {
        ctx.ui.notify(`Error: ${err.message}`, "error");
      }
    }
  });

  pi.registerCommand("wt-remove", {
    description: "Remove a worktree: /wt-remove <path>",
    handler: async (args, ctx) => {
      const target = args.trim();
      if (!target) return ctx.ui.notify("Usage: /wt-remove <path>", "warning");

      try {
        runGit(`worktree remove ${target}`, ctx);
        ctx.ui.notify(`✅ Worktree at ${target} removed.`, "success");
      } catch (err: any) {
        ctx.ui.notify(`Error: ${err.message}`, "error");
      }
    }
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
    updateFooter(ctx);
  });
}
