# {{PROJECT_NAME}}

A versioned Pi Coding Agent project scaffold with production-ready extension patterns, advanced multi-agent workflows, safety controls, themes, and agent personas.

## Prerequisites

| Tool            | Purpose                   | Install                                                    |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| **Bun** ≥ 1.3.2 | Runtime & package manager | [bun.sh](https://bun.sh)                                   |
| **just**        | Task runner               | `brew install just`                                        |
| **pi**          | Pi Coding Agent CLI       | [Pi docs](https://github.com/mariozechner/pi-coding-agent) |

## API Keys

Pi does **not** auto-load `.env` files — API keys must be present in your shell's environment before launching Pi.

```bash
cp .env.sample .env
# fill in your keys
```

### Sourcing your keys

**Option A — source manually each session:**
```bash
source .env && pi
```

**Option B — use `just` (auto-wired via `set dotenv-load`):**
```bash
just pi
just ext-minimal
```

## Installation

```bash
bun install
```

## Included Extensions

| Extension               | File                                | Description |
| ----------------------- | ----------------------------------- | ----------- |
| **pure-focus**          | `extensions/pure-focus.ts`          | Removes the footer bar and status line entirely |
| **minimal**             | `extensions/minimal.ts`             | Compact footer showing model name and context usage meter |
| **cross-agent**         | `extensions/cross-agent.ts`         | Scans `.claude/`, `.gemini/`, `.codex/` dirs for commands, skills, and agents |
| **purpose-gate**        | `extensions/purpose-gate.ts`        | Requires session intent before work begins |
| **tool-counter**        | `extensions/tool-counter.ts`        | Two-line footer with model, context, token/cost, cwd, branch, and tool counts |
| **tool-counter-widget** | `extensions/tool-counter-widget.ts` | Live widget showing per-tool call counts |
| **subagent-widget**     | `extensions/subagent-widget.ts`     | `/sub <task>` spawns background Pi subagents with live progress widgets |
| **tilldone**            | `extensions/tilldone.ts`            | Task discipline system with persistent task list and live progress |
| **agent-team**          | `extensions/agent-team.ts`          | Dispatcher-only orchestrator delegating to specialist agents |
| **system-select**       | `extensions/system-select.ts`       | `/system` command to interactively switch agent personas |
| **damage-control**      | `extensions/damage-control.ts`      | Real-time safety auditing with path and command rules |
| **agent-chain**         | `extensions/agent-chain.ts`         | Sequential pipeline orchestrator for multi-step workflows |
| **pi-pi**               | `extensions/pi-pi.ts`               | Meta-agent that builds Pi agents using parallel research experts |
| **session-replay**      | `extensions/session-replay.ts`      | Scrollable timeline overlay of session history |
| **theme-cycler**        | `extensions/theme-cycler.ts`        | Keyboard shortcuts and `/theme` command to cycle/switch themes |
| **themeMap**            | `extensions/themeMap.ts`            | Shared theme/title defaults used across extensions |
| **sentry**              | `extensions/sentry.ts`             | Error tracking middleware — load FIRST to capture errors from all extensions |
| **health-check**        | `extensions/health-check.ts`       | `/health` command showing system, API, and Sentry status |

## Usage

### Run a single extension

```bash
pi -e extensions/<name>.ts
```

### Stack multiple extensions

```bash
pi -e extensions/minimal.ts -e extensions/cross-agent.ts
```

### Use `just` recipes

```bash
just
just pi
just ext-pure-focus
just ext-minimal
just ext-cross-agent
just ext-purpose-gate
just ext-tool-counter
just ext-tool-counter-widget
just ext-subagent-widget
just ext-tilldone
just ext-agent-team
just ext-system-select
just ext-damage-control
just ext-agent-chain
just ext-pi-pi
just ext-session-replay
just ext-theme-cycler
just ext-sentry
just ext-sentry-agent-team
just ext-health-check
```

### Sentry Integration

This scaffold includes built-in error tracking via Sentry. To enable:

```bash
# 1. Copy and configure .env
cp .env.sample .env

# 2. Add your Sentry DSN (from Sentry.io → Project → Settings → Client Keys)
SENTRY_DSN=https://...@sentry.io/123456
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

**Usage:**
```bash
# Load Sentry middleware FIRST in the extension stack
just ext-sentry                    # Sentry + minimal
just ext-sentry-agent-team         # Sentry + agent-team

# Commands available when Sentry is loaded
/sentry-test       # Trigger test error
/sentry-message    # Send test message
/sentry-status     # Check connection
/sentry-flush      # Flush pending events
```

**CI Integration:**
```bash
just sentry-ping               # Test connection
just sentry-version            # Get release version
just sentry-release-create    # Create release
```

## Project Structure

```
{{project-name}}/
├── extensions/          # Pi extension source files (.ts)
├── lib/                 # Shared modules (sentry.ts, index.ts)
├── specs/               # Feature specifications for extensions and workflows
├── .pi/
│   ├── agents/          # Agent definitions, teams, and chains
│   │   ├── pi-pi/       # Expert agents for the pi-pi meta-agent
│   │   ├── agent-chain.yaml
│   │   ├── teams.yaml
│   │   └── *.md
│   ├── skills/          # Custom skills
│   ├── themes/          # Custom themes (.json)
│   ├── damage-control-rules.yaml
│   └── settings.json
├── .claude/commands/    # Prompt templates / slash commands
├── justfile             # Task definitions
├── CLAUDE.md            # Agent conventions for contributors
├── THEME.md             # Color token conventions for extension authors
├── TOOLS.md             # Built-in tool function signatures
├── RESERVED_KEYS.md     # Pi keybinding reference
├── COMPARISON.md        # Feature comparison reference doc
└── PI_VS_OPEN_CODE.md   # Architecture comparison reference doc
```

## Scaffold Philosophy

This scaffold intentionally includes the advanced workflow pieces — not just the minimal starter files.

That means new projects start with:
- full extension patterns already present
- specialist personas already defined
- team and chain orchestration configs included
- safety rules included
- themes included
- reference docs and specs included
- error tracking (Sentry) pre-configured
- health check commands built-in
- CI workflows ready to go

You can delete what you don't need, but you do **not** need to rediscover or rebuild the workflow foundation each time.

## Agent Personas

Included personas live in `.pi/agents/` and are ready for:
- planning
- building
- reviewing
- scouting
- documenting
- red-teaming
- orchestrated `pi-pi` research specialists

## Health Check

The `/health` command provides system status:

```bash
/health         # Full check (API keys, Sentry, env, deps)
/health api     # API keys only
/health sentry  # Sentry status
/health env     # Environment variables
```

## CI/CD

GitHub Actions workflow included in `.github/workflows/ci.yml`:
- Lint and build checks
- Sentry release management
- Source map upload
- Error regression detection

## References

- `THEME.md` — shared color language for UI extensions
- `TOOLS.md` — built-in tool signatures
- `RESERVED_KEYS.md` — safe/unsafe shortcut keys
- `COMPARISON.md` — Claude Code vs Pi comparison
- `PI_VS_OPEN_CODE.md` — Pi vs OpenCode comparison
