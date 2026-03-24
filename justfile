set dotenv-load := true

default:
    @just --list

# ─────────────────────────────────────────────
# Team Commands
# ─────────────────────────────────────────────

# Run diagnostic check
doctor:
    @bash ./doctor.sh

# Launch the official team stack
team-pi:
    @bash ./bin/team-pi

# ─────────────────────────────────────────────
# Groups
# ─────────────────────────────────────────────

# g1

# 1. default pi
pi:
    pi

# 2. Pure focus pi: strip footer and status line entirely
ext-pure-focus:
    pi -e extensions/pure-focus.ts

# 3. Minimal pi: model name + 10-block context meter
ext-minimal:
    pi -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 4. Cross-agent pi: load commands from .claude/, .gemini/, .codex/ dirs
ext-cross-agent:
    pi -e extensions/cross-agent.ts -e extensions/minimal.ts

# 5. Purpose gate pi: declare intent before working, persistent widget, focus the system prompt on the ONE PURPOSE for this agent
ext-purpose-gate:
    pi -e extensions/purpose-gate.ts -e extensions/minimal.ts

# 6. Customized footer pi: Tool counter, model, branch, cwd, cost, etc.
ext-tool-counter:
    pi -e extensions/tool-counter.ts

# 7. Tool counter widget: tool call counts in a below-editor widget
ext-tool-counter-widget:
    pi -e extensions/tool-counter-widget.ts -e extensions/minimal.ts

# 8. Subagent widget: /sub <task> with live streaming progress
ext-subagent-widget:
    pi -e extensions/subagent-widget.ts -e extensions/pure-focus.ts -e extensions/theme-cycler.ts

# 9. TillDone: task-driven discipline — define tasks before working
ext-tilldone:
    pi -e extensions/tilldone.ts -e extensions/theme-cycler.ts

#g2

# 10. Agent team: dispatcher orchestrator with team select and grid dashboard
ext-agent-team:
    pi -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# 11. System select: /system to pick an agent persona as system prompt
ext-system-select:
    pi -e extensions/system-select.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 12. Launch with Damage-Control safety auditing
ext-damage-control:
    pi -e extensions/damage-control.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 13. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    pi -e extensions/agent-chain.ts -e extensions/theme-cycler.ts

#g3

# 14. Pi Pi: meta-agent that builds Pi agents with parallel expert research
ext-pi-pi:
    pi -e extensions/pi-pi.ts -e extensions/theme-cycler.ts

#ext

# 15. Session Replay: scrollable timeline overlay of session history
ext-session-replay:
    pi -e extensions/session-replay.ts -e extensions/minimal.ts

# 16. Theme cycler: Ctrl+X forward, Ctrl+Q backward, /theme picker
ext-theme-cycler:
    pi -e extensions/theme-cycler.ts -e extensions/minimal.ts

# 17. Sentry middleware: auto-capture errors from all extensions (load FIRST)
ext-sentry:
    pi -e extensions/sentry.ts -e extensions/minimal.ts

# 18. Sentry with agent-team: full stack with error tracking
ext-sentry-agent-team:
    pi -e extensions/sentry.ts -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# 19. Health check: /health command with Sentry status
ext-health-check:
    pi -e extensions/health-check.ts -e extensions/sentry.ts -e extensions/minimal.ts

# Sentry example: error tracking integration demo
ext-sentry-example:
    pi -e extensions/sentry-example.ts -e extensions/minimal.ts

# ─────────────────────────────────────────────
# Power Suite (Advanced Orchestration)
# ─────────────────────────────────────────────

# Launch with automated scrum and task tracking
launch-scrum:
    pi -e extensions/agent-team.ts -e extensions/scrum-master.ts

# Launch with project planning and upstream curation
launch-planner:
    pi -e extensions/project-planner.ts -e extensions/curator.ts

# Launch with workflow engine and git worktree automation
launch-workflow:
    pi -e extensions/ruflo.ts -e extensions/git-worktree.ts

# Full Power Suite: Orchestration + Scrum + Planning + Superpowers + Workflows
launch-all:
    pi -e extensions/agent-team.ts -e extensions/scrum-master.ts -e extensions/project-planner.ts -e extensions/superpowers.ts -e extensions/ruflo.ts -e extensions/git-worktree.ts

# utils

# ─────────────────────────────────────────────
# Sentry Commands
# ─────────────────────────────────────────────

# Test Sentry connection
sentry-ping:
    @npx sentry-cli info

# Get current release version
sentry-version:
    @npx sentry-cli releases propose-version

# Create new release (for CI)
sentry-release-create:
    @npx sentry-cli releases new $$(npx sentry-cli releases propose-version) --ignore-empty

# Upload source maps
sentry-sourcemaps +files:
    @npx sentry-cli sourcemaps upload dist {{files}}

# Check for unreleased issues
sentry-issues:
    @npx sentry-cli releases needs $$(npx sentry-cli releases propose-version)

# Finalize release
sentry-release-finalize:
    @npx sentry-cli releases finalize $$(npx sentry-cli releases propose-version)

# Open pi with one or more stacked extensions in a new terminal: just open minimal tool-counter
open +exts:
    #!/usr/bin/env bash
    args=""
    for ext in {{exts}}; do
        args="$args -e extensions/$ext.ts"
    done
    cmd="cd '{{justfile_directory()}}' && pi$args"
    escaped="${cmd//\\/\\\\}"
    escaped="${escaped//\"/\\\"}"
    osascript -e "tell application \"Terminal\" to do script \"$escaped\""

# Validate all extensions for basic syntax and dependency correctness
validate-extensions:
    bun test tests/unit/extensions.test.ts

# Synchronize root source files to scaffold/v1/ template (Maintainer only)
sync-v1:
    @bash ./scripts/sync-v1.sh

# Finalize a release (vX.Y.Z)
release version:
    #!/usr/bin/env bash
    echo "{{version}}" > VERSION
    echo "{{version}}" > scaffold/v1/VERSION
    # Update package.json using perl to avoid complex JSON parsing dependencies
    perl -pi -e 's/"version": ".*?"/"version": "{{version}}"/' package.json
    perl -pi -e 's/"version": ".*?"/"version": "{{version}}"/' scaffold/v1/package.json
    git add VERSION package.json scaffold/v1/VERSION scaffold/v1/package.json CHANGELOG.md
    git commit -m "chore(release): v{{version}}"
    git tag -a "v{{version}}" -m "Release v{{version}}"
    echo "✅ Version {{version}} tagged. Run 'git push origin main --tags' to publish."

# OpenEvery extension in its own terminal window
all:
    just open pi
    just open pure-focus
    just open minimal theme-cycler
    just open cross-agent minimal
    just open purpose-gate minimal
    just open tool-counter
    just open tool-counter-widget minimal
    just open subagent-widget pure-focus theme-cycler
    just open tilldone theme-cycler
    just open agent-team theme-cycler
    just open system-select minimal theme-cycler
    just open damage-control minimal theme-cycler
    just open agent-chain theme-cycler
    just open pi-pi theme-cycler
    just open sentry minimal
    just open sentry-example minimal
    just open health-check sentry minimal
