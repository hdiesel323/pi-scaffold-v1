/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

/**
 * Ruflo Workflow Engine Extension
 * 
 * Executes multi-agent choreographies defined in YAML.
 * 
 * Usage: pi -e extensions/ruflo.ts
 * Commands: /flow-run <name>, /flow-status, /flow-approve
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";
import { parse as parseYaml } from "yaml";

interface FlowTask {
  id: string;
  agent: string;
  prompt: string;
  gate?: string;
  condition?: string;
  on_fail?: string;
  next?: string[];
}

interface FlowState {
  id: string;
  name: string;
  current_task_index: number;
  tasks: FlowTask[];
  context: Record<string, any>;
  status: 'running' | 'waiting' | 'completed' | 'failed';
}

export default function (pi: ExtensionAPI) {
  let activeFlow: FlowState | null = null;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function updateUI(ctx: ExtensionContext) {
    const statusText = activeFlow ? `Flow: ${activeFlow.name} (${activeFlow.status})` : "Flow: Idle";
    ctx.ui.setStatus("ruflo-status", `🔄 ${statusText}`);
    
    ctx.ui.setFooter((_tui, theme) => ({
      dispose: () => {},
      invalidate: () => {},
      render: (width: number) => {
        if (!activeFlow) return [theme.fg("dim", " No active flow ").padEnd(width)];
        const current = activeFlow.tasks[activeFlow.current_task_index]?.id || "None";
        return [theme.fg("accent", ` 🔄 [${activeFlow.name}] Current Task: ${current} `).padEnd(width)];
      }
    }));
  }

  async function executeCurrentTask(ctx: ExtensionContext) {
    if (!activeFlow || activeFlow.status !== 'running') return;

    const task = activeFlow.tasks[activeFlow.current_task_index];
    if (!task) {
      activeFlow.status = 'completed';
      ctx.ui.notify(`✅ Flow "${activeFlow.name}" completed successfully.`, "success");
      updateUI(ctx);
      return;
    }

    if (task.gate === 'user_approval') {
      activeFlow.status = 'waiting';
      ctx.ui.notify(`⏸️ Task "${task.id}" requires approval. Use /flow-approve`, "warning");
      updateUI(ctx);
      return;
    }

    ctx.ui.notify(`🚀 Executing Task: ${task.id} (Agent: ${task.agent})`, "info");
    
    // Simple prompt template injection
    let prompt = task.prompt.replace("{{goal}}", activeFlow.context.goal || "");
    prompt = prompt.replace("{{last_output}}", activeFlow.context.last_output || "No previous output");

    try {
      const output = await dispatchAgent(task.agent, prompt, ctx);
      activeFlow.context.last_output = output;
      
      // Logic for next task
      activeFlow.current_task_index++;
      updateUI(ctx);
      executeCurrentTask(ctx);
    } catch (err: any) {
      activeFlow.status = 'failed';
      ctx.ui.notify(`❌ Task "${task.id}" failed: ${err.message}`, "error");
      updateUI(ctx);
    }
  }

  async function dispatchAgent(agentName: string, prompt: string, ctx: ExtensionContext): Promise<string> {
    const args = [
      "--mode", "json",
      "-p",
      "--no-extensions",
      "--model", ctx.model?.id || "anthropic/claude-3-5-sonnet",
      "--append-system-prompt", `You are acting as the ${agentName}. Complete the following task and return the result.`,
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

  // ─── Commands ─────────────────────────────────────────────────────────────

  pi.registerCommand("flow-run", {
    description: "Start a named workflow: /flow-run <name> <goal>",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const name = parts[0];
      const goal = parts.slice(1).join(" ");
      const flowPath = path.join(ctx.cwd, ".pi", "flows", `${name}.yaml`);

      if (!fs.existsSync(flowPath)) return ctx.ui.notify(`Flow "${name}" not found.`, "error");

      try {
        const raw = fs.readFileSync(flowPath, "utf-8");
        const def = parseYaml(raw);
        activeFlow = {
          id: Math.random().toString(36).substring(7),
          name: def.name,
          tasks: def.tasks,
          current_task_index: 0,
          context: { goal },
          status: 'running'
        };

        ctx.ui.notify(`🔄 Flow "${name}" initialized.`, "success");
        updateUI(ctx);
        executeCurrentTask(ctx);
      } catch (e: any) {
        ctx.ui.notify(`Failed to parse flow: ${e.message}`, "error");
      }
    }
  });

  pi.registerCommand("flow-status", {
    description: "Show the current workflow progress.",
    handler: async (_args, ctx) => {
      if (!activeFlow) return ctx.ui.notify("No active flow.", "warning");

      let progress = `\nFlow: ${activeFlow.name} [${activeFlow.status.toUpperCase()}]\n`;
      activeFlow.tasks.forEach((t, i) => {
        const mark = i < activeFlow!.current_task_index ? "[✓]" : i === activeFlow!.current_task_index ? "[●]" : "[ ]";
        progress += `  ${mark} ${t.id} (${t.agent})\n`;
      });
      ctx.ui.notify(progress, "info");
    }
  });

  pi.registerCommand("flow-approve", {
    description: "Approve a gated task transition.",
    handler: async (_args, ctx) => {
      if (activeFlow && activeFlow.status === 'waiting') {
        activeFlow.status = 'running';
        ctx.ui.notify("✅ Transition approved.", "success");
        executeCurrentTask(ctx);
      } else {
        ctx.ui.notify("No flow is currently waiting for approval.", "warning");
      }
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
    updateUI(ctx);
  });
}
