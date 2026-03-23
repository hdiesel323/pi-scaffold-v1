# Changelog

All notable changes to Pi Scaffold will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-24

### Added
- **Project Rebranding**: Renamed to `pi-swarm` for better alignment with our vision of multi-agent coordination and decentralized swarms.
- **Swarm Orchestration**: Added `pi-swarm` CLI wrapper (symlinked to `bin/team-pi`) for easier access to the agent swarm.

### Changed
- **Renamed Assets**: Cleaned up all internal references to `pi-vs-cc` in extensions, documentation, and scaffold templates.
- **Directory Structure**: Moved the project to `/Users/admin/pi-swarm/` to match the new identity.
- **Documentation**: Archived old comparison files (`COMPARISON.md`, `PI_VS_OPEN_CODE.md`) into `docs/archive/` to focus on the swarm future.

## [1.1.0] - 2026-03-24

### Added - The Swarm & Power Suite
- **7 New Advanced Extensions**:
  - `project-planner.ts`: Interactive requirements interview and automated document generation (PRD/TDD/Roadmap).
  - `scrum-master.ts`: Automated task tracking, backlog sync with ROADMAP.md, and sprint health monitoring.
  - `git-worktree.ts`: Native support for parallel task execution using Git worktrees.
  - `superpowers.ts`: High-leverage Git commands (spork, spdiff, strail) and GitHub/Research skill packs.
  - `agent-catalog.ts`: Searchable agent roster with division filtering and automated smoke testing.
  - `ruflo.ts`: Declarative YAML workflow engine for complex multi-agent choreographies.
  - `curator.ts`: Automated upstream repository monitoring and feature alignment.
- **Divisional Agent Roster**:
  - Expanded to **51+ specialized agent personas**.
  - Introduced **Divisions** (Eng, Prod, Design, Mktg, Ops, Data, Sec) for enterprise-scale organization.
  - Upgraded frontmatter to v2.1 (tags, capability scores, division metadata).
- **New Launch Modes**: Integrated specific orchestration stacks for Scrum, Planning, and Workflows.
- **Specs & Blueprints**: Added formal technical specifications for all "Power Suite" systems in `specs/`.

### Changed
- **TUI Enhancements**: Agent dashboard now displays Division tags and visual status indicators.
- **Infrastructure**: `init.sh` and `scaffold/v1` synced with the new Power Suite assets.
- **Testing**: Extended validation to cover 25 total extensions and new agent metadata.

## [1.0.0] - 2026-03-23

### Added
- **Extension Suite**: 18 composable TypeScript extensions and 1 shared library (`themeMap.ts`) covering UX, orchestration, and safety.
- **Agent Definitions**: 8 top-level agent personas and 10 Pi-Pi domain experts (18 total).
- **Testing Infrastructure**: Comprehensive 3-tier testing suite (unit, integration, e2e) using `bun test`.
- **CI/CD Pipeline**: GitHub Actions workflow for automated linting (`shellcheck`) and testing on Linux and macOS.
- **Themes**: 11 curated color themes with a standardized 51-token schema.
- **Dry Run Support**: Added `--dry-run` flag to `init.sh` for safe simulation of project creation and injection.
- **Diagnostics**: `doctor.sh` script for environment health checks and tool verification.
- **Safety**: `damage-control.ts` extension and rule-set for destructive command interception.

### Changed
- **Consolidated Initialization**: Root `init.sh` is now the single canonical entry point; `scaffold/init.sh` is now a deprecated wrapper.
- **Environment Management**: Consolidated `.env.example` and `.env.sample` into a single comprehensive `.env.sample` containing 15+ provider placeholders.
- **Package Identity**: Fixed root `package.json` metadata and placeholder leakage.

### Fixed
- Fixed numeric ANSI color values in `midnight-ocean.json` theme to ensure valid hex string compatibility.
- Fixed `{{PROJECT_NAME}}` placeholder in scaffold templates to ensure correct substitution.
- Improved `init.sh` idempotency by preventing duplicate `justfile` appends in brownfield mode.

### Removed
- Removed redundant `.env.example` file.
- Removed divergent initialization logic from `scaffold/init.sh`.
