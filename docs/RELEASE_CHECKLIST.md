# Production Release Checklist (v1.0.0)

This checklist ensures that Pi Scaffold is ready for its production release.

## 1. Requirements Validation
- [ ] **P0: Extension Testing** — `tests/unit/extensions.test.ts` covers all 18 extensions.
- [ ] **P0: CI Pipeline** — `.github/workflows/ci.yml` is active and passing on Linux/macOS.
- [ ] **P0: Init Consolidation** — Root `init.sh` is canonical; `scaffold/init.sh` is a wrapper.
- [ ] **P0: Changelog** — `CHANGELOG.md` reflects all changes since inception.
- [ ] **P0: Troubleshooting** — `docs/TROUBLESHOOTING.md` created with core entries.
- [ ] **P1: Dry Run** — `init.sh --dry-run` is implemented and verified.
- [ ] **P1: Doctor Versions** — `doctor.sh` performs minimum version checks.
- [ ] **P1: Deduplication** — `scaffold/v1` uses symlinks for shared assets.

## 2. Code Quality & Metadata
- [ ] **Version Alignment** — `VERSION` file, `package.json`, and `doctor.sh` all read `1.0.0`.
- [ ] **License Header** — All `.ts` and `.sh` files contain the MIT License header.
- [ ] **Placeholders** — No `{{project-name}}` or similar remains in root production files.
- [ ] **Dependencies** — `package.json` contains all necessary peer dependencies for extensions.

## 3. Documentation
- [ ] **README** — Updated with SSH/HTTPS clone options and brownfield explanation.
- [ ] **CONTRIBUTING** — Guide created for new extensions and agent personas.
- [ ] **Troubleshooting** — Linked from main README.

## 4. Verification Gate
- [ ] `bun test` passes with 100% success rate (50+ tests).
- [ ] `shellcheck` passes for all scripts.
- [ ] Manual smoke test: Greenfield `init.sh` on clean directory.
- [ ] Manual smoke test: Brownfield `init.sh` on existing Node.js project.
- [ ] Manual smoke test: `just doctor` in a generated project.

## 5. Deployment
- [ ] `main` branch is protected.
- [ ] Git tag `v1.0.0` is ready to be pushed.
