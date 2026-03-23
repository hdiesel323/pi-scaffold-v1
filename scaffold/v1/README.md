# {{PROJECT_NAME}} — Production-Ready Pi Agent Extensions

> "There are many coding agents, but this one is mine."

A comprehensive Pi Coding Agent project scaffold for {{PROJECT_NAME}} with production-ready extension patterns, advanced multi-agent workflows, safety controls, themes, and built-in error tracking.

This README describes the generated project template contained in `v1/`.

**Built on [Pi Agent](https://pi.dev) by [Mario Zechner](https://github.com/disler).**

---

## 🚀 Quick Start (Production Ready)

Follow these steps to finish setting up your new Pi project.

### Step 1: Connect Your Accounts (Auth)
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

### Step 2: Verify & Launch
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

## Multi-Model Support

Pi supports **20+ providers**. Connect your accounts via `/login` or add keys to `.env`:

| Provider | Env Var | Discover Models |
|----------|---------|-----------------|
| Anthropic | `ANTHROPIC_API_KEY` | `pi --list-models anthropic` |
| OpenAI | `OPENAI_API_KEY` | `pi --list-models openai` |
| Google | `GEMINI_API_KEY` | `pi --list-models google` |

### Switching Models

```bash
# At runtime with flag
pi --model anthropic/claude-3-5-sonnet

# Or use /model command in Pi
/model anthropic/claude-3-5-sonnet
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
