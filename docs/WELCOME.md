# Welcome to Pi Swarm

This is the central entry point for first-time setup, daily usage, upgrades, and troubleshooting.

If you are new, start here instead of jumping between files.

## Start Here

### 1. First-Time Install

If you have never installed Pi Swarm before:

- Read [INSTALL_AND_UPDATE.md](/Users/admin/pi-swarm/docs/INSTALL_AND_UPDATE.md)
- Then follow the quick-start in [README.md](/Users/admin/pi-swarm/README.md)

### 2. Existing Project / Brownfield Setup

If you want to add Pi Swarm to an existing repo:

- Read [INSTALL_AND_UPDATE.md](/Users/admin/pi-swarm/docs/INSTALL_AND_UPDATE.md)
- Run `~/pi-swarm/init.sh --brownfield .`
- Then run `just doctor`

### 3. Team / Employee Rollout

If this is for a teammate who needs the “what is this and how do I use it?” version:

- Read [ONBOARDING_FOR_EMPLOYEES.md](/Users/admin/pi-swarm/docs/ONBOARDING_FOR_EMPLOYEES.md)

## Core Guides

### Install, Update, Reinstall

- [INSTALL_AND_UPDATE.md](/Users/admin/pi-swarm/docs/INSTALL_AND_UPDATE.md)
  Covers:
  first install, updating `~/pi-swarm`, clean reinstall, brownfield refresh, missing recipes, and manual extension stacking.

### Employee Onboarding

- [ONBOARDING_FOR_EMPLOYEES.md](/Users/admin/pi-swarm/docs/ONBOARDING_FOR_EMPLOYEES.md)
  Covers:
  high-level team introduction, prerequisites, first launch, and the main launch modes.

### Troubleshooting

- [TROUBLESHOOTING.md](/Users/admin/pi-swarm/docs/TROUBLESHOOTING.md)
  Covers:
  missing tools, auth problems, permission issues, extension import problems, and rerunning brownfield safely.

### Example Workflows

- [EXAMPLE_WORKFLOWS.md](/Users/admin/pi-swarm/docs/EXAMPLE_WORKFLOWS.md)
  Covers:
  planner sessions, team dashboard usage, scrum flows, workflow automation, full-stack launch mode, diagnostics, session replay/wrap, and manual extension stacking.

## Which Launcher Gives Which Commands

This is the most common source of confusion.

| Command | Includes | Typical Commands |
|---------|----------|------------------|
| `just team-pi` | `agent-team`, `health-check`, `sentry` | team dashboard, `/agents-team`, `/agents-list` |
| `just launch-planner` | `project-planner`, `curator` | `/plan` |
| `just launch-scrum` | `agent-team`, `scrum-master` | `/status`, `/next`, `/complete` |
| `just launch-workflow` | `ruflo`, `git-worktree` | workflow automation |
| `just launch-all` | advanced orchestration stack | power-user mode |

Important:

- `/plan` is not part of `just team-pi`
- If you need `/plan`, use `just launch-planner` or `just launch-all`

## Daily Usage

### Verify Your Environment

```bash
just doctor
```

### Start the Default Team Stack

```bash
just team-pi
```

### Start a Planner Session

```bash
just launch-planner
```

### Start the Full Advanced Stack

```bash
just launch-all
```

## Updating When a New Version Comes Out

Update the toolkit:

```bash
cd ~/pi-swarm
git pull
```

Then refresh any existing project that uses Pi Swarm:

```bash
cd /path/to/your-project
~/pi-swarm/init.sh --brownfield .
```

Then verify:

```bash
just doctor
just
```

## Clean Reinstall

If your local toolkit is stale, broken, or heavily modified:

```bash
mv ~/pi-swarm ~/pi-swarm-old-$(date +%Y%m%d-%H%M%S)
git clone https://github.com/hdiesel323/pi-swarm.git ~/pi-swarm
```

Then rerun brownfield in your project:

```bash
cd /path/to/your-project
~/pi-swarm/init.sh --brownfield .
```

## Manual Extension Stacking

If you don’t want to rely on `just`, you can stack extensions directly with multiple `-e` flags:

```bash
pi -e extensions/health-check.ts -e extensions/agent-team.ts -e extensions/sentry.ts
pi -e extensions/project-planner.ts -e extensions/curator.ts
pi -e extensions/health-check.ts -e extensions/agent-team.ts -e extensions/sentry.ts -e extensions/project-planner.ts
```

Rules:

- Use one `-e` per extension
- Order matters
- The default team stack is not the same as the planner stack

## Reference Docs

- [README.md](/Users/admin/pi-swarm/README.md)
- [INSTALL_AND_UPDATE.md](/Users/admin/pi-swarm/docs/INSTALL_AND_UPDATE.md)
- [ONBOARDING_FOR_EMPLOYEES.md](/Users/admin/pi-swarm/docs/ONBOARDING_FOR_EMPLOYEES.md)
- [TROUBLESHOOTING.md](/Users/admin/pi-swarm/docs/TROUBLESHOOTING.md)
- [EXAMPLE_WORKFLOWS.md](/Users/admin/pi-swarm/docs/EXAMPLE_WORKFLOWS.md)
- [RELEASE_CHECKLIST.md](/Users/admin/pi-swarm/docs/RELEASE_CHECKLIST.md)
- [TRANSITION.md](/Users/admin/pi-swarm/docs/TRANSITION.md)
- [ZETTELGHEST.md](/Users/admin/pi-swarm/docs/ZETTELGHEST.md)

## Suggested Next Docs to Add

As the system grows, this page should remain the directory of record. Good additions:

- `STACKS_AND_COMMANDS.md`
- `AGENT_ROSTER_GUIDE.md`
- `BROWNFIELD_MIGRATIONS.md`
- `MODEL_SETUP.md`

When those are added, link them here first.
