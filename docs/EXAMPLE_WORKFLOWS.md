# Example Workflows

This guide is the practical companion to [WELCOME.md](docs/WELCOME.md).

Use it when you want to know:

- which `just` recipe to launch
- which extensions or commands you should expect in that stack
- what a normal session looks like for each major Pi Swarm tool

## Choose the Right Starting Point

| Goal | Start Here | Main Commands |
|------|------------|---------------|
| Default multi-agent team work | `just team-pi` | `/agents-team`, `/agents-list`, `/health` |
| Project planning and requirements | `just launch-planner` | `/plan`, `/curate` |
| Task execution and sprint flow | `just launch-scrum` | `/status`, `/next`, `/complete` |
| Workflow automation and worktrees | `just launch-workflow` | `/flow-run`, `/wt-add`, `/wt-list` |
| Full advanced stack | `just launch-all` | `/plan`, `/status`, `/flow-run`, `/spork` |
| Diagnostics | `just doctor`, `just ext-health-check` | `/health` |
| Session review and wrap-up | `just ext-session-replay` plus manual `session-wrap` | `/replay`, `/wrap` |
| Custom one-off stacks | `just open ...` or manual `pi -e ...` | depends on the extensions you load |

## 1. Default Team Dashboard

Use when you want the normal team operating mode with the dispatcher grid, health checks, and error reporting.

Start:

```bash
just team-pi
```

Loaded:

- `agent-team`
- `health-check`
- `sentry`

Useful commands:

- `/agents-team`
- `/agents-list`
- `/agents-grid`
- `/health`
- `/sentry-status`

Normal session:

1. Run `just team-pi`.
2. Use `/agents-team` to choose the active roster.
3. Use `/agents-list` to confirm which specialists are available.
4. Ask the lead agent to inspect, implement, or review work.
5. Use `/health` if a teammate reports provider or environment issues.

Important:

- `/plan` is not in this stack.
- If you need planning, switch to `just launch-planner` or `just launch-all`.

## 2. Planning Workflow

Use when you need structured discovery before implementation.

Start:

```bash
just launch-planner
```

Loaded:

- `project-planner`
- `curator`

Useful commands:

- `/plan`
- `/curate`
- `/curate-apply`

Normal session:

1. Start `just launch-planner`.
2. Run `/plan`.
3. Answer the planning interview carefully.
4. Review the generated requirements or design docs.
5. Run `/curate` if you want upstream pattern comparison before building.

Best for:

- new feature scoping
- requirements discovery
- comparing your approach to upstream agent repos

## 3. Scrum / Task Execution Workflow

Use when the work is already known and you want a backlog-oriented execution loop.

Start:

```bash
just launch-scrum
```

Loaded:

- `agent-team`
- `scrum-master`

Useful commands:

- `/status`
- `/next`
- `/complete`
- `/block`
- `/standup`

Normal session:

1. Start `just launch-scrum`.
2. Run `/status` to inspect the sprint board or task state.
3. Run `/next` to pull the next unit of work.
4. Execute the task.
5. Run `/complete` or `/block` when state changes.

Best for:

- implementation sprints
- keeping a running task rhythm
- handing work between teammates with shared status

## 4. Workflow Automation

Use when the work benefits from reusable flows or parallel worktree orchestration.

Start:

```bash
just launch-workflow
```

Loaded:

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

Normal session:

1. Start `just launch-workflow`.
2. Run `/flow-run <flow-name>` to begin an automation path.
3. Monitor execution with `/flow-status`.
4. Use `/wt-add` or `/wt-list` if a branch or agent needs isolated work.
5. Clean up with `/wt-remove` when the branch is merged or abandoned.

Best for:

- repeatable multi-step engineering flows
- multi-branch parallel work
- keeping automation visible inside Pi

## 5. Full Advanced Stack

Use when you want planning, task management, Git superpowers, and workflow automation in one session.

Start:

```bash
just launch-all
```

Loaded:

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

Normal session:

1. Start `just launch-all`.
2. Run `/plan` if the work is still being scoped.
3. Use `/status` and `/next` to enter execution.
4. Use `/spork`, `/spdiff`, or `/spmerge` for Git-heavy workflows.
5. Use `/flow-run` if the task should follow a repeatable automation path.

Best for:

- staff-level or lead-level work
- large tasks that span planning, implementation, and Git choreography
- sessions where context switching is expensive

## 6. Foundation and UI Recipes

These recipes are for shaping how Pi looks and how much interface information you want while working.

### `just pi`

Use when you want plain Pi with no extra extensions.

```bash
just pi
```

### `just ext-pure-focus`

Use when you want almost no interface chrome and just want to talk to the model.

```bash
just ext-pure-focus
```

Good workflow:

1. Launch `just ext-pure-focus`.
2. Use it for thinking, writing, or quick problem solving.
3. Switch to a richer recipe only when you need dashboards or widgets.

### `just ext-minimal`

Use when you want a small footer and theme controls without a heavy UI.

```bash
just ext-minimal
```

Good workflow:

1. Launch `just ext-minimal`.
2. Use `Ctrl+X` or `Ctrl+Q` to rotate themes.
3. Keep this as a default solo-work stack when you only need context awareness.

### `just ext-tool-counter`

Use when you want visibility into tool usage, branch, cwd, or cost while working.

```bash
just ext-tool-counter
```

### `just ext-tool-counter-widget`

Use when you want tool-call visibility in a widget rather than a single footer line.

```bash
just ext-tool-counter-widget
```

### `just ext-theme-cycler`

Use when your main goal is visual comfort and rapid theme switching.

```bash
just ext-theme-cycler
```

## 7. Coordination and Control Recipes

These tools change how Pi frames, routes, or constrains work.

### `just ext-cross-agent`

Use when you want Pi to load commands from sibling agent directories such as `.claude/`, `.gemini/`, or `.codex/`.

```bash
just ext-cross-agent
```

### `just ext-purpose-gate`

Use when you want the agent to declare and maintain a single explicit working purpose.

```bash
just ext-purpose-gate
```

Good workflow:

1. Launch `just ext-purpose-gate`.
2. State the single purpose of the session.
3. Keep the session narrow until the task is complete.

### `just ext-agent-team`

Use when you want the dispatcher-only team grid without the extra health/sentry wrappers.

```bash
just ext-agent-team
```

### `just ext-system-select`

Use when you want to change personas or system prompts quickly inside the same shell.

```bash
just ext-system-select
```

### `just ext-damage-control`

Use when you want a safety-oriented session that explicitly audits risky actions.

```bash
just ext-damage-control
```

### `just ext-agent-chain`

Use when the work naturally fits a sequential pipeline instead of an open-ended conversation.

```bash
just ext-agent-chain
```

## 8. Meta-Agent and Discipline Recipes

These are high-leverage recipes for parallelization, delegation, and focus discipline.

### `just ext-subagent-widget`

Use when you want background subagents with visible progress while you keep working in the main session.

```bash
just ext-subagent-widget
```

### `just ext-tilldone`

Use when you want task completion discipline to be enforced in-session.

```bash
just ext-tilldone
```

### `just ext-pi-pi`

Use when you want the meta-agent behavior that helps design or assemble new Pi agents.

```bash
just ext-pi-pi
```

Good workflow:

1. Launch `just ext-pi-pi`.
2. Describe the agent you want to create or improve.
3. Let the meta-agent coordinate expert analysis before you accept the result.

## 9. Reliability, Diagnostics, and Review

### `just doctor`

Use first when onboarding or when something seems broken.

```bash
just doctor
```

Checks typically include:

- required tools
- auth or env readiness
- presence of team extensions

### `just ext-health-check`

Use when you want the health tooling inside Pi itself.

```bash
just ext-health-check
```

Useful commands:

- `/health`
- `/health api`
- `/health sentry`
- `/health env`

### `just ext-sentry`

Use when you want Sentry loaded first and are testing extension behavior.

```bash
just ext-sentry
```

### `just ext-sentry-agent-team`

Use when you want the dispatcher grid with Sentry but do not need the full `team-pi` wrapper.

```bash
just ext-sentry-agent-team
```

### `just ext-sentry-example`

Use when you are verifying or demonstrating the Sentry integration itself.

```bash
just ext-sentry-example
```

### `just ext-session-replay`

Use when you need to inspect or replay what happened during a session.

```bash
just ext-session-replay
```

### Session replay plus wrap-up

If you also want `/wrap`, stack `session-wrap` manually:

```bash
pi -e extensions/session-replay.ts -e extensions/session-wrap.ts
```

Before using `/wrap`, set your own paths in `.pi/wrap-config.yaml`.

Minimum setup:

```yaml
external_vault_path: ".pi/sync/external-vault"
archive_logs_path: ".pi/sync/archive-logs"
zettelkasten_mcp_path: "/absolute/path/to/zettelkasten-mcp"
```

Good workflow:

1. Review the timeline with `/replay`.
2. Confirm what was actually completed.
3. Run `/wrap <summary>` to finalize the session cleanly.

## 10. Power Users and Maintainers

### `just open <exts...>`

Use when you want a custom extension stack in a fresh Terminal window.

Example:

```bash
just open minimal tool-counter
just open agent-team theme-cycler
```

This expands to:

- `extensions/minimal.ts`
- `extensions/tool-counter.ts`

or:

- `extensions/agent-team.ts`
- `extensions/theme-cycler.ts`

### `just validate-extensions`

Use when you want a fast syntax and dependency smoke check for the extension set.

```bash
just validate-extensions
```

### `just all`

Use when you want to open a wide set of extension variants for side-by-side exploration.

```bash
just all
```

This is mainly for maintainers and extension development, not normal daily work.

## 11. Manual Extension Stacks

Use manual stacks when no existing recipe matches the exact command mix you need.

### Team dashboard plus planner

```bash
pi \
  -e extensions/health-check.ts \
  -e extensions/agent-team.ts \
  -e extensions/sentry.ts \
  -e extensions/project-planner.ts
```

### Minimal with theme cycling

```bash
pi -e extensions/minimal.ts -e extensions/theme-cycler.ts
```

### Subagents with pure focus

```bash
pi -e extensions/subagent-widget.ts -e extensions/pure-focus.ts -e extensions/theme-cycler.ts
```

### Planner plus workflow automation

```bash
pi \
  -e extensions/project-planner.ts \
  -e extensions/curator.ts \
  -e extensions/ruflo.ts \
  -e extensions/git-worktree.ts
```

Rules:

- use one `-e` per extension
- order matters
- if a command is missing, the extension that provides it is not loaded

## 12. Which Commands Come From Which Extensions

Quick mapping:

| Command | Extension |
|---------|-----------|
| `/plan` | `project-planner.ts` |
| `/curate`, `/curate-apply` | `curator.ts` |
| `/status`, `/next`, `/complete` | `scrum-master.ts` |
| `/flow-run`, `/flow-status` | `ruflo.ts` |
| `/wt-add`, `/wt-list` | `git-worktree.ts` |
| `/spork`, `/spdiff`, `/spmerge` | `superpowers.ts` |
| `/health` | `health-check.ts` |
| `/theme` | `theme-cycler.ts` |
| `/sub` | `subagent-widget.ts` |
| `/system` | `system-select.ts` |
| `/replay` | `session-replay.ts` |
| `/wrap` | `session-wrap.ts` |

## 13. If Something Is Missing

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

4. If the recipe still does not exist, launch the needed extensions manually with `pi -e ...`.
