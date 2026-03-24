# Example Workflows

This guide shows practical ways to use each major Pi Swarm stack and tool combination.

Use it after setup when you want to know:

- which launcher to start
- which commands are available in that stack
- what a normal session should look like

## 1. Default Team Dashboard

Use when you want the standard multi-agent team view with health checks and Sentry loaded.

Start:

```bash
just team-pi
```

What you get:

- `agent-team`
- `health-check`
- `sentry`

Useful commands:

- `/agents-team`
- `/agents-list`
- `/agents-grid`
- `/health`
- `/sentry-status`

Example session:

1. Start `just team-pi`
2. Run `/agents-team`
3. Pick the active team
4. Run `/agents-list`
5. Ask the lead agent to break down or execute work

Important:

- `/plan` is not part of this stack

## 2. Planning Workflow

Use when you need project scoping, requirements discovery, or planning output.

Start:

```bash
just launch-planner
```

What you get:

- `project-planner`
- `curator`

Useful commands:

- `/plan`
- `/curate`
- `/curate-apply`

Example session:

1. Start `just launch-planner`
2. Run `/plan`
3. Answer the planner interview
4. Review the generated plan/docs
5. Optionally run `/curate` to compare with upstream patterns

## 3. Scrum / Task Execution Workflow

Use when you already know the work and want sprint-style task handling.

Start:

```bash
just launch-scrum
```

What you get:

- `agent-team`
- `scrum-master`

Useful commands:

- `/status`
- `/next`
- `/complete`
- `/block`
- `/standup`

Example session:

1. Start `just launch-scrum`
2. Run `/status`
3. Run `/next`
4. Execute the task
5. Run `/complete`

## 4. Workflow Automation

Use when you want declarative orchestration and worktree-based parallel flows.

Start:

```bash
just launch-workflow
```

What you get:

- `ruflo`
- `git-worktree`

Useful commands:

- `/flow-run`
- `/flow-status`
- `/flow-approve`
- `/wt-add`
- `/wt-list`
- `/wt-sync`
- `/wt-remove`

Example session:

1. Start `just launch-workflow`
2. Run `/flow-run <flow-name>`
3. Monitor with `/flow-status`
4. Add or inspect worktrees with `/wt-list`

## 5. Full Advanced Stack

Use when you want the “everything loaded” power-user environment.

Start:

```bash
just launch-all
```

What you get:

- `agent-team`
- `scrum-master`
- `project-planner`
- `superpowers`
- `ruflo`
- `git-worktree`

Useful commands:

- `/plan`
- `/status`
- `/next`
- `/flow-run`
- `/spork`
- `/spdiff`
- `/spmerge`

Example session:

1. Start `just launch-all`
2. Run `/plan` for the work
3. Run `/status` to confirm task state
4. Use `superpowers` commands for Git-heavy execution
5. Use `/flow-run` if the work benefits from workflow automation

## 6. Health / Diagnostics Workflow

Use when something is broken or a teammate is onboarding.

Start:

```bash
just doctor
just ext-health-check
```

Useful commands:

- `/health`
- `/health api`
- `/health sentry`
- `/health env`

Example session:

1. Run `just doctor`
2. Start `just ext-health-check`
3. Run `/health`
4. Fix any missing auth or environment setup

## 7. Session Review / Wrap Workflow

Use when you want to inspect a session or finalize one cleanly.

Start:

```bash
just ext-session-replay
```

Or stack manually:

```bash
pi -e extensions/session-replay.ts -e extensions/session-wrap.ts
```

Useful commands:

- `/replay`
- `/wrap <summary>`

Example session:

1. Run `/replay`
2. Review the timeline
3. Run `/wrap completed feature X and updated docs`

## 8. Manual Extension Stacks

Use when you want a custom setup that is not in `just`.

Examples:

### Team Dashboard + Planner

```bash
pi \
  -e extensions/health-check.ts \
  -e extensions/agent-team.ts \
  -e extensions/sentry.ts \
  -e extensions/project-planner.ts
```

### Minimal + Theme Cycling

```bash
pi -e extensions/minimal.ts -e extensions/theme-cycler.ts
```

### Subagents + Pure Focus

```bash
pi -e extensions/subagent-widget.ts -e extensions/pure-focus.ts -e extensions/theme-cycler.ts
```

Rules:

- one `-e` per extension
- order matters
- if a command is missing, the extension that provides it is not loaded

## 9. Which Commands Come From Which Extensions

Quick mapping:

| Command | Extension |
|---------|-----------|
| `/plan` | `project-planner.ts` |
| `/status`, `/next`, `/complete` | `scrum-master.ts` |
| `/flow-run`, `/flow-status` | `ruflo.ts` |
| `/wt-add`, `/wt-list` | `git-worktree.ts` |
| `/health` | `health-check.ts` |
| `/theme` | `theme-cycler.ts` |
| `/sub` | `subagent-widget.ts` |
| `/system` | `system-select.ts` |
| `/replay` | `session-replay.ts` |
| `/wrap` | `session-wrap.ts` |

## 10. If Something Is Missing

If a command or recipe is missing:

1. Update the toolkit:

```bash
cd ~/pi-swarm
git pull
```

2. Refresh the project:

```bash
cd /path/to/your-project
~/pi-swarm/init.sh --brownfield .
```

3. Recheck:

```bash
just
just doctor
```
