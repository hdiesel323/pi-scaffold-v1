/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */

/**
 * Project Planner Extension v2
 * 
 * Stateful multi-agent orchestration for advanced project planning.
 * 
 * Usage: pi -e extensions/project-planner.ts
 * Commands: /plan <goal>
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { applyExtensionDefaults } from "./themeMap.ts";

type PlannerPhase = 
  | 'idle' 
  | 'scouting' 
  | 'interviewing' 
  | 'drafting_prd' 
  | 'review_prd' 
  | 'expert_panel' 
  | 'finalizing';

interface PlannerState {
  phase: PlannerPhase;
  goal: string;
  context: string;
  prdContent?: string;
  expertFeedback: Record<string, string>;
}

export default function (pi: ExtensionAPI) {
  let state: PlannerState = {
    phase: 'idle',
    goal: '',
    context: '',
    expertFeedback: {}
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Spawns a specialist agent in the background.
   */
  async function dispatchAgent(
    agentName: string, 
    prompt: string, 
    ctx: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Load agent system prompt
      const agentPath = path.join(ctx.cwd, ".pi", "agents", `${agentName}.md`);
      let systemPrompt = `You are the ${agentName}.`;
      
      if (fs.existsSync(agentPath)) {
        const raw = fs.readFileSync(agentPath, "utf-8");
        const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        systemPrompt = match ? match[2].trim() : raw;
      }

      const args = [
        "--mode", "json",
        "-p",
        "--no-extensions",
        "--model", ctx.model?.id || "anthropic/claude-3-5-sonnet",
        "--append-system-prompt", systemPrompt,
        prompt
      ];

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

      proc.on("close", (code) => {
        if (code === 0) resolve(buffer);
        else reject(new Error(`Agent ${agentName} failed with exit code ${code}`));
      });
    });
  }

  // ─── Tool: generate_project_plan ───────────────────────────────────────────

  pi.registerTool({
    name: "generate_project_plan",
    description: "Generates professional PRD, TDD, and ROADMAP files using the v2 pipeline.",
    parameters: Type.Object({
      goal: Type.String({ description: "The high-level goal of the project" }),
      context: Type.Optional(Type.String({ description: "Gathered context" })),
      docs_dir: Type.Optional(Type.String({ description: "Docs directory", default: "docs" }))
    }),
    async execute(_callId, params, _signal, onUpdate, ctx) {
      // For now, maintain v1 simple behavior but use new dispatchAgent
      const { goal, context = "", docs_dir = "docs" } = params;
      const targetDir = path.resolve(ctx.cwd, docs_dir);

      if (onUpdate) onUpdate({ content: [{ type: "text", text: "Initializing v2 Planning Pipeline..." }] });

      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      try {
        const prd = await dispatchAgent("architect", `Goal: ${goal}. Context: ${context}. Instruction: Write PRD.md content.`, ctx);
        fs.writeFileSync(path.join(targetDir, "PRD.md"), prd);

        const tdd = await dispatchAgent("architect", `Goal: ${goal}. PRD: ${prd}. Instruction: Write TDD.md.`, ctx);
        fs.writeFileSync(path.join(targetDir, "TDD.md"), tdd);

        return { content: [{ type: "text", text: "✅ Project plan generated using v2 Architect." }] };
      } catch (err: any) {
        return { content: [{ type: "text", text: `❌ v2 Pipeline Error: ${err.message}` }] };
      }
    }
  });

  // ─── Command: /plan <goal> ──────────────────────────────────────────────────

  pi.registerCommand("plan", {
    description: "Start a stateful v2 planning session.",
    handler: async (args, ctx) => {
      const goal = args.trim();
      if (!goal) {
        ctx.ui.notify("Usage: /plan <goal>", "warning");
        return;
      }

      state = { phase: 'interviewing', goal, context: '', expertFeedback: {} };
      ctx.ui.notify(`Starting v2 Planning for: ${goal}`, "info");

      pi.sendMessage({
        content: `You are the Lead Architect. Conduct a brief interview to gather requirements for the goal: ${goal}`,
        display: false
      }, { triggerTurn: true });
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
  });
}
