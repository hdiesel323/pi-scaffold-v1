# pi-swarm

## Tooling
- **Package manager**: `bun` (not npm/yarn/pnpm)
- **Task runner**: `just` (see justfile)
- **Extensions run via**: `pi -e extensions/<name>.ts`

## Project Structure
- `extensions/` — Pi extension source files (.ts)
- `specs/` — Feature specifications
- `.pi/agents/` — Agent definitions for teams, chains, and specialist personas
- `.pi/agent-sessions/` — Ephemeral session files (gitignored)
- `.pi/themes/` — Custom themes (.json)
- `.pi/skills/` — Custom skills

## Conventions
- Extensions are standalone .ts files loaded by Pi's jiti runtime
- Available imports: `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui`, `@mariozechner/pi-ai`, `@sinclair/typebox`, plus any deps in package.json
- Register tools at the top level of the extension function (not inside event handlers)
- Use `isToolCallEventType()` for type-safe tool_call event narrowing
- Prefer extending existing patterns in this scaffold over inventing new structure
