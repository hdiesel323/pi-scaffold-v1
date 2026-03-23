# Contributing to Pi Scaffold

Thank you for your interest in improving Pi Scaffold! This document provides guidelines for contributing to the toolkit.

## Adding New Extensions

Extensions are the core of Pi Scaffold. They are standalone TypeScript files located in `extensions/`.

### Extension Structure
Every extension must follow the Pi Extension API and provide a default export function:

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (event, ctx) => {
    ctx.ui.notify("Extension loaded!", "success");
  });
}
```

### Conventions
1. **Type Safety**: Use `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui`, and `@sinclair/typebox` for type definitions.
2. **Themes**: Call `applyExtensionDefaults(import.meta.url, ctx)` from `extensions/themeMap.ts` in your `session_start` hook to ensure consistent theme application.
3. **No Side Effects**: Avoid top-level side effects. Register tools and commands at the top level of the export function.

## Defining New Agents

Agents are defined as Markdown files with YAML frontmatter in `.pi/agents/`.

### Agent Schema
```markdown
---
name: my-agent
description: A brief summary of what this agent does.
tools: read,grep,ls # Optional: comma-separated whitelist
---
Your system prompt goes here.
```

If the agent is part of a team, add it to `.pi/agents/teams.yaml`.

## Running Tests

We use `bun test` for our 3-tier testing strategy.

```bash
# Run all tests
bun test

# Run specific tiers
bun test tests/unit/
bun test tests/integration/
bun test tests/e2e/
```

Before submitting a PR, ensure that:
1. `bun test` passes.
2. `shellcheck` passes for any modified `.sh` files.
3. Your code matches existing styles (TypeScript/POSIX Shell).

## Code Style

- **TypeScript**: Use 2-space indentation, semicolons, and clear naming.
- **Shell**: Use `#!/usr/bin/env bash`, `set -euo pipefail`, and follow [Google's Shell Style Guide](https://google.github.io/styleguide/shellguide.html). All scripts must pass `shellcheck`.

## Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Implement your changes and add tests if applicable.
3. Update `CHANGELOG.md` under the `[Unreleased]` section.
4. Submit a PR with a clear description of the problem and solution.
