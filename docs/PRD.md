# Product Requirements Document: Pi Scaffold v1 → Production Release

| Field          | Value                          |
|----------------|--------------------------------|
| **Version**    | 1.0.0-draft                    |
| **Status**     | Draft                          |
| **Created**    | 2026-03-23                     |
| **Author**     | Engineering                    |
| **Repo**       | `pi-vs-cc`                     |
| **Baseline**   | `VERSION` file reads `1.0.0`   |

---

## 1. Product Vision

**Pi Scaffold** is a versioned project-template generator and extension toolkit for the [Pi Coding Agent](https://github.com/nicholasgriffintn/pi-coding-agent). It ships:

- A **scaffold template** (`scaffold/v1/`) that stamps out a fully-configured Pi project in seconds.
- **18 composable extensions + 1 shared library** (`extensions/*.ts` + `themeMap.ts`) covering agent orchestration, observability, safety, UX, and meta-tooling.
- **8 top-level agent definitions + 10 pi-pi expert agents (18 total)** (`.pi/agents/`) and a **teams.yaml** orchestration layer with 5 teams.
- **11 themes** (`.pi/themes/*.json`) and a runtime `themeMap.ts` for cycle-switching.
- **doctor.sh** for environment diagnostics and **bin/team-pi** for one-command launch.
- **Bolt-ons** (`bolt-ons/agency-full/`) for optional capability packs.
- **damage-control-rules.yaml** for safety guardrails on destructive commands.

### Vision Statement

> Any engineer goes from zero to a fully-configured, team-standard Pi environment in under 2 minutes.

### What Pi Scaffold Is NOT

- **Not a bundled runtime.** It expects `pi`, `bun`, and `just` to be installed independently.
- **Not a framework.** Extensions are standalone `.ts` files loaded by Pi's `jiti` runtime — no build step.
- **Not a platform.** There is no hosted service; everything runs locally or in CI.

### Why "Production Release"

The scaffold works today for the happy path. What's missing is the reliability engineering, testing, and documentation that let someone outside the core team adopt it confidently. This PRD defines the gap between "works on my machine" and "production-grade open-source tool."

---

## 2. Target Users

| Persona              | Description                                                                 | Primary Need                                                |
|----------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------|
| **Team Developer**   | Engineer on a team that has already adopted Pi. Uses `just` recipes daily.  | Start working immediately with the team-standard stack.     |
| **Greenfield Creator** | Engineer starting a new Pi-powered project from scratch. May be solo or setting up a new team repo. | Scaffold a complete, working project in one command with sensible defaults. |
| **Brownfield Adopter** | Engineer adding Pi to an existing project (monorepo, legacy codebase).    | Add Pi config/extensions without clobbering existing files. |
| **Extension Author** | Developer building custom Pi extensions for their workflow.                 | Clear authoring guide, type-safe APIs, fast feedback loop.  |
| **Maintainer**       | Core contributor who merges PRs, cuts releases, and triages issues.        | Reliable CI, changelogs, and contributor guidelines.        |
| **Evaluator**        | Technical lead or architect evaluating Pi vs. alternatives (Claude Code, Cursor, etc.). | Understand capabilities quickly; run doctor and see green.  |

---

## 3. User Stories / Jobs-to-Be-Done

### Team Developer

| ID   | Story |
|------|-------|
| US-1 | When I clone the repo and run `just doctor`, I want to see a clear pass/fail report so I know if my environment is ready before I start coding. |
| US-2 | When I run `just team-pi`, I want Pi to launch with the team-standard extension stack (health-check + agent-team + sentry) so I don't have to remember flags. |
| US-3 | When something breaks, I want a troubleshooting guide I can check before asking a teammate so I can self-serve common issues. |

### Greenfield Creator

| ID   | Story |
|------|-------|
| US-4 | As a Greenfield Creator, I can run `init.sh my-project` and get a fully structured project with extensions, agents, themes, justfile, and doctor.sh. |
| US-5 | As a Greenfield Creator, I can immediately run `just doctor` in my new project and see all checks pass without additional setup beyond auth. |
| US-6 | As a Greenfield Creator, the generated project has a README that explains the project structure and available `just` recipes. |

### Brownfield Adopter

| ID   | Story |
|------|-------|
| US-7 | When I run `./init.sh --brownfield .` in my existing project, I want Pi config merged without overwriting my `package.json`, `.gitignore`, or `justfile` so my project stays intact. |
| US-8 | When I'm nervous about what `--brownfield` will change, I want a `--dry-run` flag that prints what would be copied/merged so I can review before committing. |
| US-9 | When init finishes, I want it to tell me exactly which files were added/modified so I can review the diff before my next commit. |

### Extension Author

| ID   | Story |
|------|-------|
| US-10 | When I create a new extension, I want a `CONTRIBUTING.md` with authoring conventions (imports, registration patterns, event handling) so I follow the team standard. |
| US-11 | When I write an extension, I want an automated validation step that catches import errors and missing exports before I push so I don't break others. |
| US-12 | When I want to start from scratch, I want a scaffolding command that generates a minimal extension template so I don't copy-paste and forget to rename things. |

### Maintainer

| ID    | Story |
|-------|-------|
| US-13 | When I merge a PR, I want CI to run real extension tests (not `echo "No tests configured yet"`) so I have confidence the change doesn't break anything. |
| US-14 | When I cut a release, I want a `CHANGELOG.md` that's either auto-generated or easy to maintain so users know what changed. |
| US-15 | When someone opens an issue about init.sh, I want exactly one canonical init script (not two divergent copies) so I know which code to fix. |

### Evaluator

| ID    | Story |
|-------|-------|
| US-16 | When I first encounter this repo, I want the README to guide me from clone to running Pi in under 2 minutes so I can form a quick opinion. |
| US-17 | When I compare Pi Scaffold to alternatives, I want `COMPARISON.md` and `PI_VS_OPEN_CODE.md` to be current and honest so I trust the project. |

---

## 4. Functional Requirements

### P0 — Must Have (Release Blockers)

| ID        | Requirement                                             | Rationale                                                                                                          | Acceptance Criteria                                                                                                                                                                          |
|-----------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FR-P0-1   | Automated test suite for extensions                     | 19 extensions have zero test coverage. A single broken import blocks every `just ext-*` recipe.                    | 1. A test file (`tests/extensions.test.mjs` or equivalent) dynamically discovers all `extensions/*.ts` files. 2. Each extension is validated for: (a) successful import via `bun build --dry-run` or `jiti` load, (b) default export is a function. 3. Critical-path extensions (`agent-team`, `health-check`, `sentry`, `damage-control`) have at least one behavioral assertion (e.g., tool registration, event handler presence). 4. `bun test` runs all tests and exits 0. |
| FR-P0-2   | CI pipeline runs real tests                             | `.github/workflows/ci.yml` test job currently runs `echo "No tests configured yet"` — CI is decoration, not protection. | 1. The `test` job in `ci.yml` runs `bun test` (or equivalent). 2. The job fails the workflow if any test fails. 3. The `lint` job runs `bun x tsc --noEmit` (or equivalent type-check) against `extensions/*.ts`. 4. CI is green on `main` after the change. |
| FR-P0-3   | Consolidate `init.sh` into one canonical script         | Two divergent init scripts exist: root `init.sh` (supports `--brownfield`) and `scaffold/init.sh` (greenfield-only). Divergence means bug fixes apply to one but not the other. | 1. Root `init.sh` is the single canonical script. 2. `scaffold/init.sh` is either deleted or replaced with a one-line redirect: `exec "$(dirname "$0")/../init.sh" "$@"`. 3. `scaffold/tests/e2e.test.mjs` is updated to reference the canonical path. 4. README references only one init path. |
| FR-P0-4   | `CHANGELOG.md` with retroactive v1.0.0 entry            | No changelog exists. Users and maintainers have no structured record of what shipped.                              | 1. `CHANGELOG.md` exists at repo root. 2. Contains a `## [1.0.0] — YYYY-MM-DD` section with a summary of initial capabilities (extensions, agents, themes, bolt-ons, init modes, doctor, CI). 3. Follows [Keep a Changelog](https://keepachangelog.com/) format. |
| FR-P0-5   | Fix `package.json` placeholder                          | `package.json` at repo root still reads `"name": "{{project-name}}"`. This is the scaffold template leaking into the distribution repo itself.                                    | 1. Root `package.json` has `"name": "pi-scaffold"` (or equivalent real name). 2. `scaffold/v1/package.json` retains `{{project-name}}` as the intended template placeholder. 3. `init.sh` continues to replace `{{project-name}}` with the slugified project name during scaffolding. |
| FR-P0-6   | Consolidate `.env.sample` vs `.env.example`             | Two divergent env sample files exist with different key sets, different formatting, and different naming conventions. Confusing for every new user. | 1. One canonical file: `.env.sample` (matches what `init.sh` references in its "Next steps" output and what `doctor.sh` references). 2. `.env.example` is deleted. 3. The surviving file includes the union of keys from both files, organized by provider, with inline comments. 4. `doctor.sh` references `.env.sample` consistently. |
| FR-P0-7   | Troubleshooting guide in `docs/`                        | No troubleshooting resource exists. Common issues (OAuth token expiry, missing `bun`/`just`, extension load failures, `.env` not sourced) have no documented resolution.            | 1. `docs/TROUBLESHOOTING.md` exists with at least 8 entries covering: (a) `pi` not found, (b) `bun` not found, (c) `just` not found, (d) OAuth token expired, (e) `.env` not sourced / keys not loaded, (f) extension fails to load (import error), (g) `just doctor` fails, (h) Sentry DSN not configured. 2. Each entry has: Symptom, Cause, Fix. 3. `README.md` links to it. |

### P1 — Should Have (Post-Release Sprint)

| ID        | Requirement                                             | Rationale                                                                                                          | Acceptance Criteria                                                                                                                                                                          |
|-----------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FR-P1-1   | `CONTRIBUTING.md` with extension authoring guide        | Extension authors have no written conventions. The 19 existing extensions are the only reference, and they vary in style. | 1. `CONTRIBUTING.md` exists at repo root. 2. Covers: (a) repo structure overview, (b) extension authoring (imports, registration pattern, event handling with `isToolCallEventType()`), (c) agent definition format (YAML frontmatter in `.md`), (d) theme JSON schema, (e) PR checklist, (f) commit message convention. 3. Links to Pi SDK docs for API reference. |
| FR-P1-2   | `init.sh --dry-run` mode for brownfield                 | Brownfield adopters are nervous about file clobbering. No way to preview changes before they happen.               | 1. `init.sh --brownfield --dry-run [target]` prints every file that would be created, copied, or merged — without writing anything. 2. Output clearly distinguishes: `[CREATE]` new files, `[MERGE]` appended content (justfile), `[SKIP]` existing files. 3. Exit code is 0 on successful dry run. |
| FR-P1-3   | Extension load-time validation                          | A broken extension silently fails or crashes Pi at startup. No pre-flight check exists outside of manually running each `just ext-*` recipe. | 1. A `just validate-extensions` recipe (or equivalent) iterates over `extensions/*.ts` and attempts a dry import via `bun build --target=bun` or similar. 2. Reports pass/fail per file with the error message on failure. 3. Runs in < 5 seconds for all 19 extensions. |
| FR-P1-4   | `doctor.sh` version compatibility checks                | `doctor.sh` checks for tool presence but not version compatibility. A user with `bun` 0.x or an ancient `pi` will pass doctor but fail at runtime.  | 1. `doctor.sh` checks minimum versions: `bun >= 1.0`, `pi >= 0.x` (define minimum), `just >= 1.0`. 2. Prints installed version alongside minimum. 3. Warns (yellow) on version mismatch instead of hard-failing, so users can still try. |
| FR-P1-5   | Deduplicate root vs `scaffold/v1/` mirrored files       | Files like `extensions/*.ts`, `.pi/agents/*`, `.pi/themes/*`, `doctor.sh`, `justfile`, etc. are duplicated between root and `scaffold/v1/`. Edits to root don't propagate to the template and vice versa. | 1. A `scripts/sync-to-v1.sh` (or `just sync-scaffold`) copies canonical root files into `scaffold/v1/`, preserving template placeholders in `package.json`, `CLAUDE.md`, `README.md`. 2. CI runs this sync and asserts no diff — i.e., `scaffold/v1/` is always a mirror of root (minus placeholder substitution). 3. Alternatively, `scaffold/v1/` is replaced with symlinks or a build step. |

### P2 — Nice to Have (Future Roadmap)

| ID        | Requirement                                             | Rationale                                                                                                          | Acceptance Criteria                                                                                                                                                                          |
|-----------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FR-P2-1   | Extension generator scaffolding command                 | Manually creating a new extension means copy-pasting an existing one and renaming. Error-prone and undiscoverable. | 1. `just new-extension <name>` creates `extensions/<name>.ts` from a template with correct imports, export signature, and inline comments. 2. Adds a corresponding `just ext-<name>` recipe to `justfile`. 3. Prints next-steps instructions. |
| FR-P2-2   | Automated changelog generation from conventional commits | Manual changelog maintenance is tedious and often skipped.                                                         | 1. A `just changelog` recipe generates `CHANGELOG.md` entries from conventional commit messages (`feat:`, `fix:`, `chore:`, etc.) since the last git tag. 2. Groups entries by type. 3. Includes PR/commit links. |
| FR-P2-3   | Bolt-on marketplace / registry                          | Only one bolt-on exists (`agency-full`). No discovery mechanism for community bolt-ons.                            | 1. A `manifest/bolt-ons.json` registry lists available bolt-ons with name, description, install command, and compatibility version. 2. A `just list-bolt-ons` recipe prints the registry. 3. `just install-bolt-on <name>` runs the bolt-on's installer. |
| FR-P2-4   | Interactive `init.sh` with prompts for extension selection | Current init copies all extensions. Users may want a subset (e.g., skip Sentry if they don't use it).             | 1. `init.sh --interactive` presents a checklist of extension groups (core, observability, orchestration, meta). 2. Selected groups determine which `extensions/*.ts` files are copied. 3. `justfile` is generated with only the relevant recipes. 4. Non-interactive mode (default) copies everything, preserving backward compatibility. |

---

## 5. Non-Functional Requirements

### 5.1 Reliability

| ID     | Requirement                                     | Target                                                                                     |
|--------|-------------------------------------------------|---------------------------------------------------------------------------------------------|
| NFR-1  | `init.sh` is idempotent in brownfield mode      | Running `init.sh --brownfield .` twice on the same directory produces no errors and no duplicate content (e.g., double-appended justfile recipes). |
| NFR-2  | `doctor.sh` uses structured exit codes           | Exit 0 = all checks pass. Exit 1 = one or more hard failures. Warnings do not affect exit code. |
| NFR-3  | Extension load failures are isolated             | A broken extension must not prevent other extensions in the same `-e` chain from loading (Pi runtime responsibility, but scaffold should document this). |
| NFR-4  | `init.sh` handles spaces in project names       | `./init.sh "My Cool Agent"` must work — slugification for `package.json`, display name for `README.md`. Verified by existing e2e test `"My Test Agent"`. |

### 5.2 Security

| ID     | Requirement                                     | Target                                                                                     |
|--------|-------------------------------------------------|---------------------------------------------------------------------------------------------|
| NFR-5  | No secrets committed to the repo                | `.env` is in `.gitignore`. `.env.sample` contains only placeholder values (`sk-...`, `AIza...`). CI/CD uses GitHub Secrets exclusively. |
| NFR-6  | `damage-control-rules.yaml` is enabled by default | The `damage-control` extension and its rule set ship with every scaffold. Default `just` recipes that include safety-critical operations load `damage-control.ts`. |
| NFR-7  | `.sentryclirc` contains no auth tokens          | The committed `.sentryclirc` must not contain `auth.token`. Tokens come from env vars only. |

### 5.3 Performance

| ID     | Requirement                                     | Target                                                                                     |
|--------|-------------------------------------------------|---------------------------------------------------------------------------------------------|
| NFR-8  | `init.sh` completes in < 5 seconds              | Excluding `bun install` network time. File copy + placeholder replacement + git init < 5s. |
| NFR-9  | `doctor.sh` completes in < 3 seconds             | All checks are local (command existence, file existence, grep). No network calls.          |
| NFR-10 | `just validate-extensions` completes in < 10 seconds | Dry-import of all 19 extensions. Parallelizable.                                          |

### 5.4 Compatibility

| ID     | Requirement                                     | Target                                                                                     |
|--------|-------------------------------------------------|---------------------------------------------------------------------------------------------|
| NFR-11 | macOS (ARM + Intel) and Linux (x86_64)          | `init.sh`, `doctor.sh`, and `bin/team-pi` use POSIX-compatible shell constructs. No macOS-only `sed` flags. |
| NFR-12 | Bun >= 1.0                                       | All `bun` commands work with Bun 1.x. `package.json` does not use Bun-specific fields that break Node fallback. |
| NFR-13 | Pi >= latest published version                   | Extensions use only stable Pi SDK APIs (no internal/undocumented imports). `doctor.sh` warns on version mismatch. |
| NFR-14 | Just >= 1.0                                      | Justfile syntax uses only stable `just` features. No nightly-only directives.              |

---

## 6. Success Metrics

| Metric                              | Target              | Measurement Method                                          |
|--------------------------------------|----------------------|-------------------------------------------------------------|
| Time from clone to running Pi        | < 2 minutes          | Manual timing: `git clone` → `just doctor` → `just team-pi` responds. |
| `just doctor` pass rate on clean macOS/Linux | > 95%         | CI matrix job on macOS-latest + ubuntu-latest.              |
| CI failures on `main`               | 0                    | GitHub branch protection: `main` requires CI green.         |
| Extension test coverage             | > 80% of extensions  | Count of extensions with at least one test ÷ total extensions. |
| Time to resolve common issues       | < 5 minutes          | User can find answer in `docs/TROUBLESHOOTING.md` without external help. |
| Init script consolidation           | 1 canonical script   | `find . -name 'init.sh' -not -path './node_modules/*'` returns exactly 1 result (or 1 + 1 redirect). |
| Placeholder leakage                 | 0 instances in root  | `grep -r '{{' . --include='*.json' --include='*.md'` returns 0 matches outside `scaffold/v1/`. |

---

## 7. Release Criteria

A release is considered **production-ready** when ALL of the following are true:

### 7.1 Code Quality

- [ ] All P0 functional requirements (FR-P0-1 through FR-P0-7) are implemented and merged to `main`.
- [ ] `bun test` passes with 0 failures.
- [ ] `bun x tsc --noEmit` (or equivalent) passes for all `extensions/*.ts`.
- [ ] No `{{placeholder}}` strings exist in root-level files (only in `scaffold/v1/` templates).
- [ ] `package.json` at root has a real package name, not `{{project-name}}`.

### 7.2 CI / CD

- [ ] `.github/workflows/ci.yml` test job runs real tests (not `echo`).
- [ ] CI is green on `main`.
- [ ] CI runs on both `ubuntu-latest` (required) and `macos-latest` (stretch goal).

### 7.3 Documentation

- [ ] `CHANGELOG.md` exists with a `[1.0.0]` entry.
- [ ] `docs/TROUBLESHOOTING.md` exists with ≥ 8 entries.
- [ ] `README.md` links to troubleshooting guide.
- [ ] One canonical `.env.sample` file; `.env.example` deleted.

### 7.4 Init Consolidation

- [ ] One canonical `init.sh` at repo root.
- [ ] `scaffold/init.sh` is either removed or is a pass-through redirect.
- [ ] E2e tests pass against the canonical init path.

### 7.5 Smoke Test (Manual)

- [ ] On a clean macOS machine: clone → `just doctor` → green → `./init.sh test-project /tmp` → `cd /tmp/test-project && just doctor` → green → `just team-pi` → Pi launches.
- [ ] On a clean Ubuntu machine (or CI): same sequence passes.
- [ ] `./init.sh --brownfield .` on an existing Node project: no file clobbering, Pi config merged correctly.

---

## 8. Risk Register

| ID   | Risk                                              | Likelihood | Impact   | Mitigation                                                                                                       |
|------|----------------------------------------------------|------------|----------|------------------------------------------------------------------------------------------------------------------|
| R-1  | **Pi breaking changes** — upstream Pi releases a breaking API change that invalidates extension imports or hooks. | Medium     | High     | Pin `@mariozechner/pi-coding-agent` to a known-good version range in `package.json`. Add a `pi --version` check in `doctor.sh`. Subscribe to Pi release notes. |
| R-2  | **Extension API instability** — Pi TUI/AI SDK APIs change signatures without deprecation warnings.              | Medium     | High     | Extension tests (FR-P0-1) catch breakage at CI time. Maintain a compatibility matrix in `docs/`. Vendor critical type definitions if needed. |
| R-3  | **Brownfield file conflicts** — `init.sh --brownfield` overwrites user files unexpectedly (justfile appending duplicates, `.gitignore` conflicts). | High       | Medium   | Implement `--dry-run` (FR-P1-2). Add idempotency guards (check for `# ── Pi Extension Stacks` marker before appending to justfile). Add e2e test for double-run idempotency. |
| R-4  | **Team adoption friction** — new team members find setup confusing due to multiple env files, two init scripts, placeholder-laden `package.json`. | High       | Medium   | All P0 requirements directly address this. Post-release: measure time-to-first-launch in onboarding sessions. |
| R-5  | **Single-maintainer bus factor** — one person understands the full scaffold, agent definitions, and extension architecture. | Medium     | High     | Write `CONTRIBUTING.md` (FR-P1-1). Document architecture decisions in `docs/ARCHITECTURE.md` (future). Pair-program on complex changes. |
| R-6  | **No telemetry for usage** — no data on which extensions are used, which init mode is popular, or where users get stuck. | High       | Low      | Acceptable for v1. Track adoption via GitHub stars, issues, and manual feedback. Consider opt-in anonymous usage reporting in v2 (with clear disclosure). |
| R-7  | **OAuth token expiry edge cases** — `doctor.sh` checks for `auth.json` existence but not token validity. Users pass doctor but fail at runtime. | Medium     | Medium   | Add a token-age check in `doctor.sh` (warn if `auth.json` is older than 30 days). Document re-auth flow in `docs/TROUBLESHOOTING.md`. |
| R-8  | **Cross-platform shell compatibility** — `init.sh` uses `perl` for placeholder replacement, macOS `sed` differs from GNU `sed`, `bash` version varies. | Medium     | Medium   | Use `perl` (already done) instead of `sed` for replacements. Avoid Bash 4+ features (`mapfile`, associative arrays). Test in CI on both `ubuntu-latest` and `macos-latest`. Add `shellcheck` to CI lint job. |
| R-9  | **Scaffold/v1 drift** — root files and `scaffold/v1/` copies drift further apart over time as developers edit one but not the other. | High       | Medium   | Implement sync script or CI assertion (FR-P1-5). Consider making `scaffold/v1/` a generated artifact rather than a manually maintained copy. |
| R-10 | **Sentry integration assumes Sentry** — multiple extensions and CI jobs assume Sentry is configured. Users without Sentry see confusing warnings or failures. | Medium     | Low      | Ensure all Sentry-dependent code gracefully degrades (check `SENTRY_DSN` before initializing). `ci.yml` already uses `if: env.SENTRY_AUTH_TOKEN != ''`. Document Sentry as optional in README and troubleshooting guide. |

---

## Appendix A: File Inventory (Current State)

Reference map of key files discussed in this PRD:

```
pi-vs-cc/
├── init.sh                          # Root init (greenfield + brownfield) — CANONICAL
├── scaffold/
│   ├── init.sh                      # Scaffold-only init (greenfield) — TO BE REMOVED/REDIRECTED
│   ├── tests/e2e.test.mjs           # E2e tests for scaffold — references scaffold/init.sh
│   ├── v1/                          # Template snapshot — mirrors root files
│   └── .github/workflows/e2e.yml    # Scaffold CI — runs real tests
├── extensions/                      # 19 TypeScript extensions (zero test coverage)
│   ├── agent-team.ts
│   ├── damage-control.ts
│   ├── health-check.ts
│   ├── sentry.ts
│   ├── ... (15 more)
│   └── themeMap.ts
├── .pi/
│   ├── agents/                      # 11 agent definitions + teams.yaml
│   ├── themes/                      # 11 theme JSON files
│   └── damage-control-rules.yaml    # Safety guardrails
├── .github/workflows/ci.yml         # CI pipeline — test step is placeholder
├── bin/team-pi                      # One-command launcher
├── doctor.sh                        # Environment diagnostics
├── justfile                         # 20+ recipes for extension stacks
├── package.json                     # ⚠️  name: "{{project-name}}"
├── .env.sample                      # ⚠️  Provider keys sample (Pi-focused)
├── .env.example                     # ⚠️  Provider keys sample (Taskmaster-focused) — DUPLICATE
├── VERSION                          # 1.0.0
├── CLAUDE.md                        # Project instructions for Claude
├── COMPARISON.md                    # Pi vs alternatives
├── PI_VS_OPEN_CODE.md               # Pi vs Open Code comparison
├── RESERVED_KEYS.md                 # Reserved environment variable keys
├── THEME.md                         # Theme documentation
├── TOOLS.md                         # Tool documentation
├── bolt-ons/agency-full/            # Optional agency bolt-on pack
├── conductor/plan.md                # Conductor planning doc
├── manifest/distro.json             # Distribution manifest
└── specs/                           # Feature specifications
```

## Appendix B: Requirement → File Mapping

Traceability from each P0 requirement to the specific files that must change:

| Requirement | Files to Create                        | Files to Modify                                                    | Files to Delete       |
|-------------|----------------------------------------|--------------------------------------------------------------------|-----------------------|
| FR-P0-1     | `tests/extensions.test.mjs`            | `package.json` (add test script)                                   | —                     |
| FR-P0-2     | —                                      | `.github/workflows/ci.yml` (test + lint jobs)                      | —                     |
| FR-P0-3     | —                                      | `scaffold/init.sh` (replace with redirect), `scaffold/tests/e2e.test.mjs` (update paths), `README.md` | —          |
| FR-P0-4     | `CHANGELOG.md`                         | —                                                                  | —                     |
| FR-P0-5     | —                                      | `package.json` (root — set real name)                              | —                     |
| FR-P0-6     | —                                      | `.env.sample` (merge keys from `.env.example`)                     | `.env.example`        |
| FR-P0-7     | `docs/TROUBLESHOOTING.md`              | `README.md` (add link)                                             | —                     |

## Appendix C: Dependency Graph

```
FR-P0-1 (extension tests)
    └──→ FR-P0-2 (CI runs tests)  [P0-1 must exist before P0-2 can reference it]

FR-P0-3 (consolidate init.sh)
    └──→ FR-P1-2 (--dry-run)      [dry-run is added to the canonical script]

FR-P0-5 (fix package.json)
    └──→ FR-P0-1 (tests)          [test script added to same file]

FR-P0-6 (consolidate .env)
    └──→ FR-P0-7 (troubleshooting) [troubleshooting references .env.sample]

FR-P1-1 (CONTRIBUTING.md)
    └──→ FR-P2-1 (extension generator) [generator follows conventions from CONTRIBUTING]

FR-P1-5 (deduplicate scaffold/v1/)
    └──→ FR-P0-3 (consolidate init.sh) [init consolidation simplifies the sync]
```

---

*End of PRD. All requirements are actionable and map to concrete code changes. Implementation should proceed in P0 → P1 → P2 order, with P0 items targeted for the production release gate.*
