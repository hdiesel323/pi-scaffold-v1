# Production Release Checklist (v1.2.1)

This checklist ensures that Pi Swarm is ready for its production release.

## 1. Requirements Validation
- [x] **P0: Extension Testing** — `tests/unit/extensions.test.ts` covers the shipped extensions and import validation.
- [x] **P0: CI Pipeline** — `.github/workflows/ci.yml` is active and passing on Linux/macOS.
- [x] **P0: Init Consolidation** — Root `init.sh` is canonical; `scaffold/init.sh` is a wrapper.
- [x] **P0: Changelog** — `CHANGELOG.md` reflects release history through 1.2.1.
- [x] **P0: Troubleshooting** — `docs/TROUBLESHOOTING.md` exists with core entries.
- [x] **P1: Dry Run** — `init.sh --dry-run` is implemented and verified.
- [x] **P1: Doctor Versions** — `doctor.sh` performs minimum version checks.
- [x] **P1: Deduplication** — `scaffold/v1` reuses shared assets via the wrapper structure.

## 2. Code Quality & Metadata
- [x] **Version Alignment** — `VERSION` file, `package.json`, and `doctor.sh` all read `1.2.1`.
- [ ] **License Header** — All `.ts` and `.sh` files contain the MIT License header.
- [ ] **Placeholders** — No `{{project-name}}` or similar remains in root production files.
- [ ] **Dependencies** — `package.json` contains all necessary peer dependencies for extensions.

## 3. Documentation
- [x] **README** — Updated with SSH/HTTPS clone options, brownfield explanation, and current model discovery guidance.
- [x] **CONTRIBUTING** — Guide created for new extensions and agent personas.
- [x] **Troubleshooting** — Linked from main README.

## 4. Verification Gate
- [x] `bun test` passes with 100% success rate.
- [ ] `shellcheck` passes for all scripts.
- [x] Manual smoke test: Greenfield `init.sh` on clean directory.
- [x] Manual smoke test: Brownfield `init.sh` on existing Node.js project.
- [x] Manual smoke test: `just doctor` in a generated project.

## 5. Deployment
- [ ] `main` branch is protected.
- [ ] Git tag `v1.2.1` is ready to be pushed.
