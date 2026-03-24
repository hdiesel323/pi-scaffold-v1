# Install, Update, and Reinstall Pi Swarm

This guide is for first-time setup and for keeping an existing local toolkit or brownfield project current.

## 1. First-Time Install

Clone the toolkit once:

```bash
# HTTPS
git clone https://github.com/hdiesel323/pi-swarm.git ~/pi-swarm

# OR SSH
git clone git@github.com:hdiesel323/pi-swarm.git ~/pi-swarm
```

Install prerequisites:

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

# just
brew install just

# pi
go install github.com/mariozechner/pi-coding-agent@latest
```

Then either:

```bash
# New project
~/pi-swarm/init.sh my-new-project

# Existing project
cd /path/to/existing-project
~/pi-swarm/init.sh --brownfield .
```

Verify:

```bash
just doctor
```

## 2. Update to the Latest Version

When a new Pi Swarm version is released:

```bash
cd ~/pi-swarm
git pull
```

If you use Pi Swarm inside an existing project, rerun brownfield so the project picks up new launchers, recipes, extensions, and docs:

```bash
cd /path/to/existing-project
~/pi-swarm/init.sh --brownfield .
```

Then verify:

```bash
just doctor
just
```

## 3. Clean Reinstall

If your local toolkit is old, broken, or heavily modified:

```bash
mv ~/pi-swarm ~/pi-swarm-old-$(date +%Y%m%d-%H%M%S)
git clone https://github.com/hdiesel323/pi-swarm.git ~/pi-swarm
```

Then refresh your project:

```bash
cd /path/to/existing-project
~/pi-swarm/init.sh --brownfield .
```

## 4. Which Launcher Gives Which Commands

The most common point of confusion is `/plan`.

- `just team-pi` does not include `project-planner.ts`
- `just launch-planner` includes `/plan`
- `just launch-all` includes the advanced orchestration stack

Quick reference:

```bash
just team-pi        # team dashboard
just launch-planner # /plan
just launch-scrum   # /status, /next, /complete
just launch-workflow
just launch-all
```

If a recipe is missing from `just`, your project likely has an older brownfield `justfile`. Update `~/pi-swarm`, then rerun:

```bash
~/pi-swarm/init.sh --brownfield .
```

## 5. Manual Extension Stacking

You can always bypass `just` and stack extensions directly:

```bash
pi -e extensions/health-check.ts -e extensions/agent-team.ts -e extensions/sentry.ts
pi -e extensions/project-planner.ts -e extensions/curator.ts
pi -e extensions/health-check.ts -e extensions/agent-team.ts -e extensions/sentry.ts -e extensions/project-planner.ts
```

Rules:

- Use one `-e` per extension
- Order matters
- The default team stack is not the same as the planner stack

## 6. Zettelkasten / Session Wrap Setup

New and brownfield installs now include:

- `.pi/wrap-config.yaml`
- `docs/TRANSITION.md`
- `docs/ZETTELKASTEN.md`

To enable `/wrap` with your own Zettelkasten MCP, edit `.pi/wrap-config.yaml`:

```yaml
external_vault_path: ".pi/sync/external-vault"
archive_logs_path: ".pi/sync/archive-logs"
zettelkasten_mcp_path: "/absolute/path/to/zettelkasten-mcp"
```

Notes:

- `ZETTELKASTEN.md` is the canonical knowledge-base file name.
- Older projects that still have `docs/ZETTELGHEST.md` are still supported by the wrap extension.
- Relative paths are resolved from the project root.

## 7. Memory Cave and Backend Stubs

New and brownfield installs now also include a local memory scaffold:

```text
.pi/memory/
  README.md
  config.yaml
  index.md
  inbox/
  sessions/
  decisions/
  entities/
  runbooks/
  patterns/
  archives/
```

Backend stubs live in `.pi/memory/config.yaml` and are disabled by default.

You can point them at:

- your Zettelkasten MCP
- a vector API
- a database API

See [MEMORY_SYSTEM.md](docs/MEMORY_SYSTEM.md) for the full layout.
