/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

/**
 * Scrum Master Extension
 * 
 * Provides automated task tracking, progress dashboards, and agile orchestration.
 * 
 * Usage: pi -e extensions/scrum-master.ts
 * Commands: /status, /next [--parallel], /complete <id>, /block <id> <reason>, /standup
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { spawn, execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";

type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';

interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  blocker?: string;
  updatedAt: string;
  worktreePath?: string;
}

interface ProjectState {
  tasks: ProjectTask[];
}

export default function (pi: ExtensionAPI) {
  let projectState: ProjectState = { tasks: [] };
  const statePath = (ctx: ExtensionContext) => path.join(ctx.cwd, ".pi", "project-state.json");

  // ─── Internal Logic ────────────────────────────────────────────────────────

  function loadState(ctx: ExtensionContext) {
    const p = statePath(ctx);
    if (fs.existsSync(p)) {
      try {
        projectState = JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch (e) {
        ctx.ui.notify("Failed to parse project-state.json", "error");
      }
    } else {
      syncWithRoadmap(ctx);
    }
  }

  function saveState(ctx: ExtensionContext) {
    const p = statePath(ctx);
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(projectState, null, 2));
    updateUI(ctx);
  }

  function syncWithRoadmap(ctx: ExtensionContext) {
    const roadmapPath = path.join(ctx.cwd, "ROADMAP.md");
    if (!fs.existsSync(roadmapPath)) return;

    const content = fs.readFileSync(roadmapPath, "utf-8");
    const tasks: ProjectTask[] = [];
    const lines = content.split("\n");
    let taskIdCounter = 1;

    for (const line of lines) {
      const match = line.match(/^\s*-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        tasks.push({
          id: `${taskIdCounter++}`,
          title: match[2].trim(),
          status: match[1].toLowerCase() === 'x' ? 'done' : 'todo',
          updatedAt: new Date().toISOString()
        });
      }
    }
    projectState.tasks = tasks;
    saveState(ctx);
  }

  async function runScrumAgent(prompt: string, ctx: ExtensionContext): Promise<string> {
    const scrumAgentPath = path.join(ctx.cwd, ".pi", "agents", "scrum-master.md");
    let systemPrompt = "You are the Scrum Master.";
    if (fs.existsSync(scrumAgentPath)) {
      const raw = fs.readFileSync(scrumAgentPath, "utf-8");
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      systemPrompt = match ? match[2].trim() : raw;
    }

    const stateJson = JSON.stringify(projectState);
    const args = [
      "--mode", "json",
      "-p",
      "--no-extensions",
      "--append-system-prompt", `${systemPrompt}\n\nCurrent project state: ${stateJson}`,
      prompt
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn("pi", args, { env: { ...process.env } });
      let buffer = "";
      proc.stdout.on("data", (chunk) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "message_update" && event.assistantMessageEvent?.type === "text_delta") {
              buffer += event.assistantMessageEvent.delta;
            }
          } catch (e) {}
        }
      });
      proc.on("close", (code) => code === 0 ? resolve(buffer) : reject(new Error(`Exit code ${code}`)));
    });
  }

  function updateUI(ctx: ExtensionContext) {
    const total = projectState.tasks.length;
    const done = projectState.tasks.filter(t => t.status === 'done').length;
    const active = projectState.tasks.find(t => t.status === 'in-progress');

    ctx.ui.setStatus("scrum-progress", `📊 ${done}/${total} tasks`);
    ctx.ui.setFooter((_tui, theme) => ({
      dispose: () => {},
      invalidate: () => {},
      render: (width: number) => {
        const text = active ? `🏃 Active: ${active.title}` : "💤 No active task";
        const content = theme.fg("accent", ` ${text} `);
        return [content.padEnd(width)];
      }
    }));
  }

  // ─── Slash Commands ────────────────────────────────────────────────────────

  pi.registerCommand("status", {
    description: "Show project progress dashboard.",
    handler: async (_args, ctx) => {
      const total = projectState.tasks.length;
      const done = projectState.tasks.filter(t => t.status === 'done').length;
      const blocked = projectState.tasks.filter(t => t.status === 'blocked');
      
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));

      let output = `\nProject Status: [${bar}] ${pct}%\n`;
      output += `Tasks: ${done} completed, ${total - done} remaining.\n`;
      
      if (blocked.length > 0) {
        output += `\n🛑 Blocked Tasks:\n`;
        blocked.forEach(t => output += `  - [${t.id}] ${t.title}: ${t.blocker}\n`);
      }

      ctx.ui.notify(output, "info");
    }
  });

  pi.registerCommand("next", {
    description: "Ask the Scrum Master for the next task. Use --parallel for worktrees or --flow <name> for workflows.",
    handler: async (args, ctx) => {
      const parallel = args.includes("--parallel");
      const flowMatch = args.match(/--flow\s+(\S+)/);
      const flowName = flowMatch ? flowMatch[1] : null;

      ctx.ui.notify("Scrum Master is analyzing backlog...", "info");
      
      try {
        if (flowName) {
          const task = projectState.tasks.find(t => t.status === 'todo');
          if (!task) return ctx.ui.notify("No pending tasks for workflow execution.", "warning");
          
          ctx.ui.notify(`Starting workflow "${flowName}" for task: ${task.title}`, "success");
          // Update status locally
          task.status = 'in-progress';
          saveState(ctx);

          // We execute the command directly via the extension logic if possible, 
          // or rely on the user running the suggested command.
          // For automation, we trigger the command handler.
          pi.registerCommand("flow-run", { handler: async () => {} }); // dummy check if exists
          
          // Re-dispatching to the flow-run command logic
          pi.sendMessage({
            content: `/flow-run ${flowName} ${task.title}`,
            display: true
          }, { triggerTurn: true });

        } else if (parallel) {
          const task = projectState.tasks.find(t => t.status === 'todo');
          if (!task) return ctx.ui.notify("No pending tasks found for parallel execution.", "warning");

          const branch = `task-${task.id}-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.slice(0, 50);
          const wtPath = path.resolve(ctx.cwd, `../${branch}`);
          
          ctx.ui.notify(`Provisioning worktree for: ${task.title}...`, "info");
          execSync(`git worktree add ${wtPath} -b ${branch}`, { cwd: ctx.cwd });
          
          task.status = 'in-progress';
          task.worktreePath = wtPath;
          saveState(ctx);
          
          ctx.ui.notify(`✅ Worktree ready at ${wtPath}. Task #${task.id} started.`, "success");
        } else {
          const suggestion = await runScrumAgent("Based on the ROADMAP.md and state, what is the next task we should start? Suggest an agent persona.", ctx);
          ctx.ui.notify(`Suggested Next: ${suggestion}`, "success");
        }
      } catch (err: any) {
        ctx.ui.notify(`Error: ${err.message}`, "error");
      }
    }
  });

  pi.registerCommand("complete", {
    description: "Mark a task as completed: /complete <id>",
    handler: async (args, ctx) => {
      const id = args.trim();
      const task = projectState.tasks.find(t => t.id === id);
      if (!task) return ctx.ui.notify(`Task ${id} not found.`, "warning");

      task.status = 'done';
      task.updatedAt = new Date().toISOString();
      
      // Attempt to sync ROADMAP.md
      const roadmapPath = path.join(ctx.cwd, "ROADMAP.md");
      if (fs.existsSync(roadmapPath)) {
        try {
          const content = fs.readFileSync(roadmapPath, "utf-8");
          const updatedContent = content.replace(new RegExp(`- \\[ \\] ${task.title}`, 'g'), `- [x] ${task.title}`);
          fs.writeFileSync(roadmapPath, updatedContent);
        } catch (e) {}
      }

      saveState(ctx);
      ctx.ui.notify(`Task ${id} marked as done and ROADMAP updated.`, "success");
    }
  });

  pi.registerCommand("block", {
    description: "Mark a task as blocked: /block <id> <reason>",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const id = parts[0];
      const reason = parts.slice(1).join(" ");
      const task = projectState.tasks.find(t => t.id === id);
      if (!task) return ctx.ui.notify(`Task ${id} not found.`, "warning");

      task.status = 'blocked';
      task.blocker = reason;
      task.updatedAt = new Date().toISOString();
      saveState(ctx);
      ctx.ui.notify(`Task ${id} marked as blocked.`, "error");
    }
  });

  pi.registerCommand("standup", {
    description: "Generate a daily standup summary.",
    handler: async (_args, ctx) => {
      ctx.ui.notify("Generating standup summary...", "info");
      try {
        const summary = await runScrumAgent("Generate a daily standup: Done today, To do tomorrow, Blockers.", ctx);
        ctx.ui.notify(summary, "info");
      } catch (err: any) {
        ctx.ui.notify(`Error: ${err.message}`, "error");
      }
    }
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
    loadState(ctx);
    updateUI(ctx);
  });
}
