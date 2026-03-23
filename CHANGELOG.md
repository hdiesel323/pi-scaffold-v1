# Changelog

All notable changes to Pi Scaffold will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
