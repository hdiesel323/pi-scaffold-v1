# Pi Scaffold — Production-Ready Pi Agent Extensions

> "There are many coding agents, but this one is mine."

A comprehensive Pi Coding Agent toolkit for the team. This repository provides standard extensions, agents, and themes that can be "injected" into any project or used to start a brand new one.

**Built on [Pi Agent](https://pi.dev) by [Mario Zechner](https://github.com/disler).**

---

## 🚀 Quick Start (Zero to Pi)

Follow these steps to get Pi running on your machine.

### Step 1: One-Time Setup (The Toolkit)
First, clone this toolkit to your home directory. You only need to do this **once**.
```bash
# HTTPS
git clone https://github.com/hdiesel323/pi-scaffold-v1.git ~/pi-scaffold

# OR SSH (recommended for remote/CI environments)
git clone git@github.com:hdiesel323/pi-scaffold-v1.git ~/pi-scaffold
```
Already cloned? Pull the latest: `cd ~/pi-scaffold && git pull`

---

### Step 2: Choose Your Path

#### Path A: Start a NEW Project
Use this if you are beginning a brand new repository.
```bash
# This creates a new folder named 'my-new-agent'
~/pi-scaffold/init.sh my-new-agent
cd my-new-agent
```

#### Path B: Add to an EXISTING Project
Use this to add Pi configuration to a project you are already working on.
```bash
# 1. Navigate to your existing project
cd /path/to/your-project

# 2. Inject Pi configuration (your existing files won't be overwritten)
~/pi-scaffold/init.sh --brownfield .
```
> **What this does:** Copies Pi extensions, agent configs, themes, and tooling into your project. Existing files are never overwritten — if a file already exists, it's skipped. Your `justfile` will have Pi recipes appended (not replaced).

---

### Step 3: Connect Your Accounts (Auth)
The easiest way to connect Pi to your models is via **OAuth**. This opens your browser and logs you in securely.

```bash
# Inside Pi, run:
/login anthropic
/login google
/login openai
# etc.
```

Alternatively, you can use API Keys in `.env`:
1. `cp .env.sample .env`
2. Add your `ANTHROPIC_API_KEY`, etc. to the file.

---

### Step 4: Verify & Launch
```bash
# 1. Verify everything is correct
just doctor

# 2. Start the team stack
just team-pi
```

---

## 🏥 Diagnostic Tool (`just doctor`)
The `doctor` command verifies:
- Are the required tools (`pi`, `bun`, `just`) installed?
- Is your auth (OAuth or `.env`) set up?
- Are the team extensions (`extensions/`) present?

---

## 🛠 Team Launcher (`just team-pi`)
The `team-pi` command launches Pi with the team's standard configuration:
- **agent-team**: A multi-agent system (Scout, Planner, Builder, Reviewer).
- **sentry**: Automatically reports errors so we can fix them.
- **health-check**: Monitors your API connection status.

---

## Prerequisites (Install these first)

| Tool | Purpose | Install |
|------|---------|---------|
| **Bun** | Runtime | [bun.sh](https://bun.sh) |
| **just** | Task runner | `brew install just` |
| **pi** | The Agent | `go install github.com/mariozechner/pi-coding-agent@latest` |

---

## Multi-Model Support

Pi supports **20+ providers**. Connect your accounts via `/login` or add keys to `.env`:

| Provider | Env Var | Discover Models |
|----------|---------|-----------------|
| Anthropic | `ANTHROPIC_API_KEY` | `pi --list-models anthropic` |
| OpenAI | `OPENAI_API_KEY` | `pi --list-models openai` |
| Google | `GEMINI_API_KEY` | `pi --list-models google` |
| MiniMax | `MINIMAX_API_KEY` | `pi --list-models minimax` |
| ZAI | `ZAI_API_KEY` | `pi --list-models zai` |
| Groq | `GROQ_API_KEY` | `pi --list-models groq` |
| xAI | `XAI_API_KEY` | `pi --list-models xai` |
| OpenRouter | `OPENROUTER_API_KEY` | `pi --list-models openrouter` |

### Switching Models

```bash
# At runtime with flag
pi --model minimax/chatgpt-o3-mini
pi --model zai/Bests
pi --model groq/llama-3.3-70b

# Or use /model command in Pi
/model groq/llama-3.3-70b
```

---

## Extension Tiers

### Tier 1: Foundation (UI Customization)

| Recipe | Purpose |
|--------|---------|
| `just ext-pure-focus` | Strip all UI — pure conversation |
| `just ext-minimal` | Compact footer with model + context meter |
| `just ext-tool-counter` | Rich footer with tool counts, tokens, cost |
| `just ext-tool-counter-widget` | Live widget showing per-tool call counts |
| `just ext-theme-cycler` | Ctrl+X/Q to cycle 13 themes |

### Tier 2: Agent Orchestration

| Recipe | Purpose |
|--------|---------|
| `just ext-agent-team` | Dispatcher with team grid dashboard |
| `just ext-system-select` | `/system` to switch agent personas |
| `just ext-damage-control` | Safety auditing (blocks dangerous commands) |
| `just ext-agent-chain` | Sequential pipeline orchestrator |

### Tier 3: Meta Agents

| Recipe | Purpose |
|--------|---------|
| `just ext-pi-pi` | Meta-agent that builds Pi agents via 8 expert agents |
| `just ext-subagent-widget` | `/sub <task>` spawns background agents with live progress |
| `just ext-tilldone` | Task discipline — agent must complete tasks before finishing |

### Observability & Health

| Recipe | Purpose |
|--------|---------|
| `just ext-sentry` | Error tracking middleware (load FIRST) |
| `just ext-sentry-agent-team` | Full stack with Sentry error capture |
| `just ext-health-check` | `/health` command with system/API/Sentry status |

---

## Extension Reference

### pure-focus.ts
Removes footer and status line entirely. Pure conversation with the model.

### minimal.ts
Compact footer showing model name and context meter.

### agent-team.ts
**Dispatcher-only orchestrator.** The primary agent has NO codebase tools — it can ONLY delegate to specialist agents.

**Teams defined in `.pi/agents/teams.yaml`:**
- `full`: scout, planner, builder, reviewer, documenter, red-team
- `plan-build`: planner, builder, reviewer

---

## Theme System

13 built-in themes in `.pi/themes/` including:
`synthwave`, `catppuccin-mocha`, `cyberpunk`, `dracula`, `everforest`, `gruvbox`, `nord`, `tokyo-night`.

**Usage:**
- Cycle forward: **Ctrl+X**
- Cycle backward: **Ctrl+Q**
- Pick from list: **/theme**

---

## License

MIT — Fork, customize, and make it yours.
