# Pi Scaffold — Production-Ready Pi Agent Extensions

> "There are many coding agents, but this one is mine."

A comprehensive Pi Coding Agent project scaffold with production-ready extension patterns, advanced multi-agent workflows, safety controls, themes, and built-in error tracking.

**Built on [Pi Agent](https://pi.dev) by [Mario Zechner](https://github.com/disler).**

## Why Pi Agent?

| Feature | Claude Code | Pi Agent |
|---------|-------------|-----------|
| **License** | Proprietary | Open Source |
| **System Prompt** | ~10,000 tokens (fixed) | ~200 tokens (customizable) |
| **Default Tools** | Many (abstracted) | 4 (read, write, edit, bash) |
| **Permission Mode** | 5 modes | YOLO (full access) |
| **Model Support** | Anthropic only | Any model |
| **UI Customization** | Limited | Full control |
| **Multi-Agent** | Built-in | Build your own |
| **Hooks/Events** | Essential set | 25+ plug-in points |

**The strategy**: Use Claude Code for out-of-the-box speed. Use Pi Agent for deep customization, multi-agent orchestration, and when you need to hedge against lock-in.

---

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| **Bun** ≥ 1.3.2 | Runtime & package manager | [bun.sh](https://bun.sh) |
| **just** | Task runner | `brew install just` |
| **pi** | Pi Coding Agent CLI | [Pi docs](https://github.com/mariozechner/pi-coding-agent) |

---

## Quick Start

```bash
# Clone and setup
git clone https://github.com/hdiesel323/pi-scaffold-v1.git my-agent
cd my-agent

# Copy and configure environment
cp .env.sample .env
# Add your API keys (OpenAI, Anthropic, Gemini, etc.)
# Add SENTRY_DSN for error tracking (optional)

# Run with error tracking
just ext-sentry-agent-team
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

```bash
pi -e extensions/pure-focus.ts
```

### minimal.ts
Compact footer showing:
- Model name (e.g., "claude-sonnet-4-6")
- Context meter (10-block bar)
- Context percentage

```bash
pi -e extensions/minimal.ts -e extensions/theme-cycler.ts
```

### tool-counter.ts
Two-line footer with:
- Model name
- Context usage
- Tokens in/out
- Estimated cost
- Current directory + git branch
- Tool call counts

### cross-agent.ts
Scans `.claude/`, `.gemini/`, `.codex/` directories to auto-load:
- Commands (slash commands)
- Skills
- Agents

### purpose-gate.ts
Requires session intent before work begins. Appends purpose to system prompt.

```bash
# On boot, prompts: "What is the purpose of this agent?"
# Purpose persists in widget throughout session
```

### agent-team.ts
**Dispatcher-only orchestrator.** The primary agent has NO codebase tools — it can ONLY delegate to specialist agents.

**Teams defined in `.pi/agents/teams.yaml`:**
```yaml
full:
  - scout
  - planner
  - builder
  - reviewer
  - documenter
  - red-team

plan-build:
  - planner
  - builder
  - reviewer
```

**Commands:**
- `/agents-team` — Select active team
- `/agents-list` — List loaded agents
- `/agents-grid N` — Set grid columns (1-6)

### damage-control.ts
Safety auditing via hooks. Blocks:
- Dangerous bash commands (configurable patterns)
- Read/write to sensitive paths
- Deletion of critical files

Rules in `.pi/damage-control-rules.yaml`.

### pi-pi.ts
**Meta-agent that builds Pi agents.** Spawns 8 parallel expert agents:
- `ext-expert` — Extension patterns
- `theme-expert` — Theme customization
- `skill-expert` — Skill development
- `config-expert` — Configuration
- `tui-expert` — UI/TUI customization
- `prompt-expert` — System prompts
- `agent-expert` — Agent definitions
- `cli-expert` — CLI flags

### sentry.ts
**Error tracking middleware.** Load FIRST in extension stack to capture errors from ALL extensions.

**Automatically captures:**
- `tool_execution_error` — Tool failures with input
- `command_error` — Command errors
- `agent_error` — Agent errors
- Breadcrumbs for tool calls and messages

**Commands (when loaded):**
- `/sentry-test` — Trigger test error
- `/sentry-message` — Send test message
- `/sentry-status` — Check connection
- `/sentry-flush` — Flush pending events

---

## Theme System

13 built-in themes in `.pi/themes/`:

| Theme | Description |
|-------|-------------|
| synthwave | Purple/pink neon (default) |
| catppuccin-mocha | Soft pastel |
| cyberpunk | High contrast neon |
| dracula | Purple/violet |
| everforest | Warm green |
| gruvbox | Retro brown |
| midnight-ocean | Deep blue |
| nord | Arctic blue |
| ocean-breeze | Light blue |
| rose-pine | Rose quartz |
| tokyo-night | Japanese night |

**Usage:**
```bash
# Cycle forward: Ctrl+X
# Cycle backward: Ctrl+Q
# Pick from list: /theme
```

---

## Agent Personas

Located in `.pi/agents/`:

| Agent | Purpose |
|-------|---------|
| scout | Explore codebase, find files |
| planner | Create implementation plans |
| builder | Write code |
| reviewer | Review and critique |
| documenter | Generate docs |
| red-team | Security testing |

---

## Sentry Integration

### Setup

```bash
# 1. Get DSN from Sentry.io
#    Project → Settings → Client Keys

# 2. Add to .env
SENTRY_DSN=https://...@sentry.io/123456
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
NODE_ENV=development
```

### Usage

```bash
# Load Sentry FIRST in stack
just ext-sentry                    # Sentry + minimal
just ext-sentry-agent-team         # Sentry + agent-team

# Commands
/sentry-test      # Test error capture
/sentry-status    # Check connection
/sentry-flush    # Flush events
```

### CI Integration

```bash
just sentry-ping              # Test connection
just sentry-version           # Get release version
just sentry-release-create   # Create release
just sentry-issues           # Check unreleased errors
```

GitHub Actions workflow in `.github/workflows/ci.yml` automatically:
- Creates Sentry releases
- Uploads source maps
- Detects error regressions

---

## Health Check

```bash
/health         # Full check (API keys, Sentry, env, deps)
/health api     # API keys only
/health sentry  # Sentry status
/health env     # Environment variables
```

---

## Stack Extensions

Pi allows stacking multiple extensions:

```bash
# Minimal + theme cycling
pi -e extensions/minimal.ts -e extensions/theme-cycler.ts

# Agent team + themes + Sentry
pi -e extensions/sentry.ts -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# Subagent + pure focus + theme cycling
pi -e extensions/subagent-widget.ts -e extensions/pure-focus.ts -e extensions/theme-cycler.ts
```

---

## Comparison: Pi Agent vs Claude Code

| Aspect | Claude Code | Pi Agent |
|--------|-------------|----------|
| **Source** | Closed, proprietary | Open source |
| **System Prompt** | ~10K tokens, fixed | ~200 tokens, customizable |
| **Default Tools** | 100+ abstracted | 4 (read/write/edit/bash) |
| **Permissions** | 5 modes | YOLO (you handle safety) |
| **Models** | Anthropic only | Any (OpenAI, Gemini, local, etc.) |
| **UI/Footer** | Limited customization | Full control |
| **Subagents** | Built-in | Build your own |
| **Hooks** | ~10 essential | 25+ plug-in points |
| **Themes** | 4 default | 13 + create your own |
| **Mode** | Opinionated defaults | Minimal, add what you need |

### When to Use Which?

**Use Claude Code when:**
- Quick prototyping
- Enterprise compliance needed
- Out-of-the-box defaults are fine
- Don't need deep customization

**Use Pi Agent when:**
- Need full harness control
- Building multi-agent systems
- Using non-Anthropic models
- Want to hedge against vendor lock-in
- Need custom UI/footer
- Building agentic products

---

## Project Structure

```
pi-scaffold/
├── extensions/              # 19 extension .ts files
│   ├── sentry.ts           # Error tracking (load FIRST)
│   ├── agent-team.ts       # Multi-agent dispatcher
│   ├── pi-pi.ts           # Meta-agent builder
│   └── ...
├── lib/                    # Shared modules
│   └── sentry.ts          # Reusable Sentry module
├── .pi/
│   ├── agents/             # Agent definitions
│   │   ├── teams.yaml     # Team configs
│   │   └── *.md          # Persona definitions
│   ├── themes/            # 13 JSON themes
│   └── damage-control-rules.yaml
├── .github/workflows/
│   └── ci.yml             # CI with Sentry
├── justfile               # 30+ recipes
└── README.md
```

---

## Commands Reference

```bash
# List all recipes
just

# Run extensions
just pi                      # Plain Pi
just ext-minimal            # Compact footer
just ext-agent-team         # Multi-agent
just ext-pi-pi             # Meta-agent
just ext-sentry            # Error tracking

# Open in new Terminal window
just open minimal tool-counter
just open agent-team theme-cycler

# Sentry
just sentry-ping
just sentry-version
```

---

## Troubleshooting

### "pi: command not found"
```bash
export PATH="$HOME/go/bin:$PATH"
# Or reinstall: go install
```

### API key errors
```bash
# Verify keys loaded
source .env && env | grep API_KEY

# Check .env exists
ls -la .env
```

### Extension not loading
```bash
# Verify file exists
ls extensions/

# Try direct run
pi -e extensions/minimal.ts
```

---

## Contributing

This scaffold is designed to be extended. To add new extensions:

1. Create `extensions/your-extension.ts`
2. Register tools, commands, hooks at top level
3. Use `isToolCallEventType()` for type-safe event handling
4. Add to `justfile` with recipe

See `CLAUDE.md` for full conventions.

---

## Resources

- [Pi Agent](https://pi.dev) — Official website
- [Pi Agent GitHub](https://github.com/mariozechner/pi-coding-agent)
- [Mario Zechner](https://github.com/disler) — Creator of Pi
- [Sentry Docs](https://docs.sentry.io)
- [Bun](https://bun.sh)
- [just](https://github.com/casey/just)

---

## Credits

This scaffold was built to showcase the extensibility of [Pi Agent](https://pi.dev), created by **[Mario Zechner](https://github.com/disler)**.

> "Pi is a minimal agentic coding tool built for engineers who want full control."

Thank you Mario for building such an incredible, customizable foundation for agentic engineering.

---

## License

MIT — Fork, customize, and make it yours.
