# Technical Design: Company Pi Team Distro

## Related PRD / Issue
This design implements [docs/prd-company-pi-distro-rpg.txt](./prd-company-pi-distro-rpg.txt). It is the canonical technical design for turning the current scaffold into a deployable internal Pi distro for macOS and Linux.

## Objective
Add a thin but complete distro layer on top of the existing scaffold so maintainers can ship a tagged internal release and users can install, diagnose, generate, and run the company-standard Pi setup through a stable command surface.

## Scope Alignment
This design covers:

- a canonical repo-level distro manifest
- install and doctor CLI entry points
- a wrapper launcher at `bin/team-pi`
- generated-project distro metadata
- release packaging and checksums
- product-level validation for install, doctor, wrapper, generation, and packaging

This design does not cover:

- Pi core changes or a Pi fork
- Windows support in the first release
- a GUI installer
- automatic update infrastructure
- provider account provisioning

## Current System / Reuse Candidates
- [init.sh](../init.sh): existing project generator; already handles validation, placeholder replacement, git init, and optional `bun install`.
- [scripts/export-v1.sh](../scripts/export-v1.sh): current export flow for a standalone starter repo.
- [v1/](../v1/README.md): packaged project payload containing the extensions, `.pi/`, `.claude/`, CI, docs, and env guidance the distro should preserve.
- [v1/justfile](../v1/justfile): current recipe surface and source of truth for launch-stack definitions.
- [v1/.env.sample](../v1/.env.sample): current provider/auth documentation that should inform doctor expectations.
- [tests/e2e.test.mjs](../tests/e2e.test.mjs): current scaffold-level validation harness to preserve and extend.
- [package.json](../package.json): existing Node test entry point.

## Proposed Technical Approach
### Architecture Overview
The distro layer should sit above the scaffold foundation:

1. `manifest/distro.json` defines the runtime and release contract.
2. `install.sh` reads the manifest, validates the environment, and materializes a usable workspace.
3. `doctor.sh` runs the same checks independently for support and preflight.
4. `bin/team-pi` is the stable user-facing launcher and default runtime entry point.
5. Generated projects receive `v1/.pi/distro.json` so they preserve the distro/runtime contract.
6. `scripts/package-release.sh` assembles a clean artifact and checksum.
7. `tests/distro.test.mjs` validates the product-level behavior, while `tests/e2e.test.mjs` remains focused on scaffold generation.

## Component / Module Changes

### 1. Canonical distro manifest
Add `manifest/distro.json`.

Required fields:

```json
{
  "distroVersion": "1.0.0",
  "templateVersion": "v1",
  "piVersionRange": ">=0.0.0 <2.0.0",
  "bunVersionRange": ">=1.3.2",
  "justVersionRange": ">=1.0.0",
  "supportedOs": ["darwin", "linux"],
  "defaultLaunchRecipe": "ext-sentry-agent-team",
  "namedLaunchModes": {
    "default": "ext-sentry-agent-team",
    "minimal": "ext-minimal",
    "health-check": "ext-health-check",
    "agent-team": "ext-agent-team"
  },
  "supportedProviders": [
    "anthropic",
    "openai",
    "google",
    "minimax",
    "zai",
    "groq",
    "xai",
    "openrouter"
  ],
  "releaseArtifactName": "company-pi-distro"
}
```

Rules:
- `defaultLaunchRecipe` must reference a real recipe already present in `v1/justfile`.
- `namedLaunchModes` is the complete supported mode list for the wrapper in v1.
- `supportedOs` is limited to `darwin` and `linux`.
- `supportedProviders` is documentation and doctor-check guidance, not a guarantee that credentials are present.

Add a generated-project copy at `v1/.pi/distro.json` during generation and release packaging.

### 2. Shared shell helpers
Add `scripts/lib/common.sh`.

Responsibilities:
- uniform log functions: `info`, `warn`, `error`, `success`
- `detect_os`
- `require_command`
- `read_manifest_value`
- `compare_semver_range`
- `resolve_repo_root`
- `safe_realpath`

Implementation rule:
- keep helpers side-effect free except for printing and exit helpers
- parse JSON via `node` instead of shell string hacks

### 3. Installer surface
Add `install.sh` plus `scripts/install/`.

CLI contract:

```bash
./install.sh [target-dir] [--project-name NAME] [--no-install-deps] [--check-only]
```

Behavior:
- default `target-dir` is current directory
- `--project-name NAME` means create a new generated project via `init.sh`
- without `--project-name`, materialize the distro workspace itself in the target directory
- `--no-install-deps` means verify but do not attempt installation of missing prerequisites
- `--check-only` performs all validations and prints the plan without writing repo-tracked outputs

Implementation split:
- `install.sh`: argument parsing and top-level orchestration
- `scripts/install/prereqs.sh`: verify/install `pi`, `bun`, `just`
- `scripts/install/materialize.sh`: stage files or call `init.sh` as appropriate
- `scripts/install/post_install.sh`: write receipt, print next steps, and validate final layout

Decision:
- For generated projects, installer must call `init.sh` rather than reimplement template copy and placeholder behavior.
- For distro installation, installer must copy the release bundle contents directly, not synthesize them ad hoc.

### 4. Doctor surface
Add `doctor.sh` plus `scripts/doctor/checks.sh`.

CLI contract:

```bash
./doctor.sh [--json] [--quick] [--project-dir PATH]
```

Checks:
- supported OS
- presence of `pi`, `bun`, `just`
- version compatibility against manifest ranges
- presence/readability of repo-level or project-level distro metadata
- presence of required runtime assets:
  - `extensions/`
  - `.pi/`
  - `.claude/`
  - `justfile`
  - `.env.sample`
- `.env` presence for generated projects
- provider visibility:
  - in `--quick` mode: verify at least one relevant provider env var or auth source is present
  - in full mode: run provider-scoped `pi --list-models <provider>` only for providers with visible auth

Output contract:
- human-readable mode prints grouped pass/warn/fail sections
- JSON mode returns:
  - `ok`
  - `platform`
  - `commands`
  - `versions`
  - `project`
  - `providers`
  - `errors`
  - `warnings`
- exit code is non-zero if any blocking failure exists

### 5. Wrapper launcher
Add `bin/team-pi`.

CLI contract:

```bash
bin/team-pi [doctor|minimal|health-check|agent-team|-- <pi-args...>]
```

Behavior:
- no args: run default mode from manifest, which is `ext-sentry-agent-team`
- `doctor`: exec `./doctor.sh --quick`
- `minimal`: launch `ext-minimal`
- `health-check`: launch `ext-health-check`
- `agent-team`: launch `ext-agent-team`
- `-- <pi-args...>`: pass raw args through to `pi` after preflight

Preflight:
- resolve repo root from script location or current working directory
- locate manifest and runtime assets
- run `doctor.sh --quick`
- if quick doctor fails, stop and print how to run full doctor

Launch resolution:
- named launch modes resolve to concrete `pi -e ...` stacks via a static mapping derived from `v1/justfile`
- do not shell out to `just` for wrapper launches in v1; invoke `pi` directly so wrapper behavior remains explicit and testable

Concrete v1 launch mappings:
- `ext-sentry-agent-team`: `pi -e extensions/sentry.ts -e extensions/agent-team.ts -e extensions/theme-cycler.ts`
- `ext-minimal`: `pi -e extensions/minimal.ts -e extensions/theme-cycler.ts`
- `ext-health-check`: `pi -e extensions/health-check.ts -e extensions/sentry.ts -e extensions/minimal.ts`
- `ext-agent-team`: `pi -e extensions/agent-team.ts -e extensions/theme-cycler.ts`

### 6. Generated-project metadata and docs
Update the scaffold flow so generated projects include `v1/.pi/distro.json`.

Required generated-project behavior:
- `init.sh` copies or writes distro metadata after template generation
- generated README references `bin/team-pi` and `doctor.sh` as the preferred runtime surface once the distro layer exists
- `.env.sample` remains the source for provider expectations
- brownfield docs remain secondary and must not conflict with wrapper/doctor guidance

### 7. Release packaging
Add `scripts/package-release.sh`.

Outputs:
- `dist/company-pi-distro-<version>.tar.gz`
- `dist/company-pi-distro-<version>.sha256`

Included files:
- `manifest/distro.json`
- `install.sh`
- `doctor.sh`
- `bin/team-pi`
- `scripts/lib/common.sh`
- required install/doctor helper scripts
- `init.sh`
- `v1/`
- core docs needed by users and maintainers

Excluded files:
- `.git/`
- local `.env`
- `node_modules/`
- temp/log files
- test-only fixtures and caches

Packaging rule:
- assemble from a clean staging directory
- compute checksum after archive creation

### 8. Test layout
Preserve and split test concerns:

- `tests/e2e.test.mjs`: scaffold generation, export flow, placeholder replacement, runtime recipe wiring, bolt-on compatibility
- `tests/distro.test.mjs`: manifest, installer, doctor, wrapper, generated-project distro metadata, release packaging

Node test entry:
- keep `npm test` as the package entry point
- update `package.json` if needed so both test files run

## Interfaces / APIs / Contracts

### Manifest contract
Consumed by:
- `install.sh`
- `doctor.sh`
- `bin/team-pi`
- `scripts/package-release.sh`
- `tests/distro.test.mjs`

Compatibility rule:
- minor releases may add manifest fields
- existing fields cannot change meaning without a major distro version bump

### Install receipt contract
Path:
- distro workspace: `.pi/distro-install.json`
- generated projects: `.pi/distro-install.json`

Required fields:
- `distroVersion`
- `templateVersion`
- `installedAt`
- `platform`
- `targetDir`

### Generated-project contract
Every generated project created by the distro-backed scaffold must contain:
- `.pi/distro.json`
- `.pi/`
- `.claude/`
- `extensions/`
- `justfile`
- `.env.sample`

## Data / Storage / Migration Impact
No database changes.

New persistent files:
- `manifest/distro.json`
- `v1/.pi/distro.json`
- `.pi/distro-install.json` in installed/generated outputs

Migration approach:
- existing generated starter repos can adopt the distro layer by copying in `bin/team-pi`, `doctor.sh`, the manifest metadata, and any required docs
- no destructive migration is required

## Async Jobs / External Integrations
- Install, doctor, wrapper, and packaging remain synchronous shell flows.
- External dependencies:
  - `pi`
  - `bun`
  - `just`
  - optional provider visibility probes through `pi --list-models`

Design rule:
- only use provider-scoped `pi --list-models` checks in full doctor mode when that provider appears configured

## Security / Permissions / Safety Controls
- Never print raw API key values.
- Doctor may mention which providers appear configured, but only by provider name.
- Install and packaging scripts must fail before writing into an existing non-empty target directory unless explicitly designed to support update semantics in a later release.
- Packaging must exclude local secrets and transient files.
- Wrapper preflight must stop on blocking failures instead of attempting a partial launch.

## Performance / Reliability Considerations
- Quick doctor should complete in under 2 seconds in the common case without slow provider probes.
- Full doctor may run provider checks and can be slower, but should remain bounded and clearly message progress.
- Wrapper launch must only run quick checks so normal daily startup remains fast.
- Install should remain mostly I/O bound and complete quickly on supported machines when prerequisites are already present.

## Failure Modes / Recovery
- Unsupported OS:
  - install/doctor fail with explicit supported-platform guidance
- Missing `pi`, `bun`, or `just`:
  - install either installs or reports exact remediation depending on flags
  - doctor reports blocking failure
- Pi version mismatch:
  - install and doctor fail with expected version range and next step
- Missing distro manifest:
  - doctor and wrapper fail because the runtime contract is unreadable
- Missing generated-project metadata:
  - wrapper blocks and doctor instructs the user to regenerate or repair the project
- Provider visibility failure:
  - doctor warns or fails depending on whether any supported provider is usable
- Packaging missing required files:
  - packaging fails before archive creation

Recovery path:
- rerun doctor after fixing prerequisites
- regenerate the project or reinstall the distro if metadata/layout is incomplete
- cut a corrected release if the manifest or packaged contents are wrong

## Test Plan
Required automated coverage:
- manifest validation
- installer happy path with fake binaries
- installer blocked by unsupported OS / wrong Pi version
- doctor quick/full mode behavior
- JSON doctor output shape
- wrapper default launch and named mode launch
- wrapper failure on bad preflight
- generated-project distro metadata inclusion
- release packaging output contents and checksum

Optional local smoke coverage:
- real `pi --version`
- real provider visibility checks behind opt-in env vars

## Rollout / Release Workflow
1. Update `manifest/distro.json` for the release.
2. Run `npm test`.
3. Run targeted local smoke checks:
   - install
   - doctor
   - wrapper launch
   - generated-project creation
4. Run `scripts/package-release.sh`.
5. Verify archive contents and checksum.
6. Publish the artifact through the internal distribution channel.

## Assumptions
- The distro remains a thin layer around upstream Pi.
- v1 wrapper defaults to the full stack represented by `ext-sentry-agent-team`.
- Named launch modes are fixed to `default`, `minimal`, `health-check`, and `agent-team` in the first release.
- macOS and Linux are the only supported platforms in the first deployment-ready release.
