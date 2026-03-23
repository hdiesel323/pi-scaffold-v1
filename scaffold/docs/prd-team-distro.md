# Pi Team Distro from Scaffold

> Status: Historical exploratory PRD. The canonical full team distro PRD is `docs/prd-company-pi-distro-rpg.txt`. This file remains for reference only.

## Goal
Turn the current Pi scaffold into a downloadable, repeatable team distribution that can be installed and launched with a pinned runtime, standardized defaults, and product-level validation.

## Background / Context
The current repository has two distinct layers:

- A scaffold product at the repo root: [README.md](../README.md), [init.sh](../init.sh), and [tests/e2e.test.mjs](../tests/e2e.test.mjs) define a versioned template generator.
- A generated Pi workspace template under [v1/](../v1/README.md), with extensions, agents, themes, CI, and team docs.

Today the product is still a Pi scaffold, not a full team distribution of Pi itself. Evidence in the current repo:

- [README.md](../README.md) describes "Versioned project templates for bootstrapping new Pi Coding Agent codebases."
- [init.sh](../init.sh) copies `v1/` into a new directory and initializes git; it does not install or pin Pi.
- [tests/e2e.test.mjs](../tests/e2e.test.mjs) validates template generation and recipe wiring, not clean-machine product installation.
- [v1/README.md](../v1/README.md) still requires users to bring their own `pi`, `bun`, `just`, and provider authentication.

The project should move from "scaffold around upstream Pi" to "team-standard distro built on a pinned upstream Pi runtime" without forking Pi core unless that later becomes necessary.

## Problem Statement
Teams cannot treat the current scaffold as a reliable internal product because installation and runtime behavior still depend on manual local setup:

- Pi must already exist on the machine.
- Bun and just must already exist on the machine.
- Provider auth must already be configured correctly.
- There is no enforced Pi version contract between the scaffold and the runtime.
- There is no first-run doctor or support flow when setup is wrong.
- There is no release artifact that can be distributed as a stable team package.

This creates onboarding friction, inconsistent environments, broken recipes, and support overhead. The current repo is replicable as source code, but not yet replicable as a working product experience.

## Users / Operators / Stakeholders
- Team developers who need a standard Pi-based environment that works the same way on every supported machine.
- Engineering leads who need a repeatable distro with pinned defaults, documented behavior, and low support overhead.
- Repo maintainers who ship new scaffold versions, manage runtime compatibility, and support releases.
- New team members who need one-command setup instead of manual toolchain assembly.

## In Scope
- Define the product boundary as a team distro built on top of upstream Pi, not a generic template only.
- Add one-command install and validation flows for supported developer machines.
- Pin and enforce the supported Pi runtime version for each scaffold release.
- Package the team defaults already present in `v1/`: extensions, agents, themes, prompts, env template, and recipes.
- Add a `doctor` flow that verifies prerequisites, auth visibility, and runtime compatibility.
- Add a wrapper launcher so users invoke the team distro consistently instead of calling `pi` directly.
- Add release artifacts and version metadata so the distro can be downloaded and reproduced.
- Add product-level tests for fresh install, first launch, and basic runtime validation.
- Support macOS and Linux as initial target platforms.

## Out of Scope
- Forking or rewriting Pi core in this phase.
- Building a GUI installer.
- Supporting Windows in the first release.
- Provisioning provider accounts or generating API keys for users.
- Replacing Pi's native provider auth model.
- Building a marketplace for arbitrary third-party extensions.
- Shipping automatic updates in the first release.

## Requirements
### Functional
- The distro must provide a single documented install entry point for a fresh machine.
- The install flow must verify or install required local dependencies for supported platforms.
- The install flow must verify that the machine has the pinned Pi runtime version required by the distro release.
- The distro must expose a wrapper command, tentatively `team-pi`, that launches the supported runtime with the team-standard project defaults.
- The distro must provide a `doctor` command that reports:
  - missing dependencies
  - Pi version mismatch
  - missing project assets
  - missing or unsupported provider auth
  - next-step remediation guidance
- The distro must preserve the current scaffold value:
  - create a new project from a versioned template
  - support brownfield adoption of selected extensions and assets
  - keep template versioning reproducible across releases
- The distro must ship release metadata that identifies:
  - distro version
  - scaffold/template version
  - supported Pi version
  - supported OS targets
  - supported provider families
- The repo must include automated validation for:
  - fresh install from release artifact
  - generation of a new project
  - launching the wrapper command in a smoke-test mode
  - doctor output on both success and expected failure states

### Non-functional
- The first-run path must be deterministic and documented well enough for internal team onboarding.
- Failures must be actionable; error messages must say what is wrong and what command to run next.
- The distro must prefer reuse of the current scaffold assets over duplicating or rewriting them.
- Release outputs must be reproducible from tagged repo state.
- The product must remain understandable as a thin layer around upstream Pi, not a second hidden runtime system.
- The product must minimize secrets exposure: installers and doctor commands must never print API key values.
- Target installation time on a normal developer machine should be under 10 minutes, excluding provider signup.

## UX / Behavior Details
- Fresh install:
  - User downloads a tagged release artifact or clones a tagged release.
  - User runs one install command.
  - The installer checks platform, prerequisites, pinned Pi version, and project assets.
  - The installer reports completion plus the exact next launch command.
- First run:
  - User runs `team-pi` or an equivalent wrapper command.
  - If required setup is missing, the wrapper points to `doctor` instead of failing silently.
  - If auth is incomplete, the wrapper explains which provider families are visible and which are missing.
- Project generation:
  - Users can still create a new repo from the versioned template.
  - Generated projects contain the distro metadata needed for later compatibility checks.
- Brownfield setup:
  - Users can still import selected extensions into an existing repo, but that is a secondary path.
  - Docs must clearly distinguish the full distro path from the extension-only path.

## Capability Tree

### Capability: Distribution and Installation
Ship the scaffold as a runnable team product, not only as source files.

#### Feature: Release artifact install
- **Description**: Install the distro from a tagged release with one documented entry point.
- **Inputs**: Release artifact, target machine, install options.
- **Outputs**: Ready-to-run distro workspace with validated runtime contract.
- **Behavior**: Unpack assets, verify prerequisites, materialize metadata, and emit next steps.

#### Feature: Runtime pinning
- **Description**: Enforce the Pi version supported by the distro release.
- **Inputs**: Distro manifest, installed `pi` version.
- **Outputs**: Pass/fail compatibility result with remediation guidance.
- **Behavior**: Compare installed version against the distro contract before launch and during doctor checks.

#### Feature: Dependency bootstrap
- **Description**: Verify or install required local tools.
- **Inputs**: OS type, required tools, install mode.
- **Outputs**: Tool availability result.
- **Behavior**: Detect missing tools, install where supported, or stop with platform-specific instructions.

### Capability: Team Runtime
Make the packaged team defaults launchable and supportable.

#### Feature: Wrapper launcher
- **Description**: Launch Pi through a team-owned command with pinned defaults.
- **Inputs**: CLI args, project path, distro manifest.
- **Outputs**: Running Pi process or actionable setup error.
- **Behavior**: Validate prerequisites, select the supported runtime, and forward args to Pi.

#### Feature: First-run doctor
- **Description**: Diagnose setup problems before users hit runtime failures.
- **Inputs**: Local toolchain, project files, auth visibility.
- **Outputs**: Human-readable and scriptable health report.
- **Behavior**: Check required commands, project assets, version contracts, and provider readiness.

#### Feature: Team defaults packaging
- **Description**: Bundle extensions, agents, themes, prompts, and env guidance as a standard stack.
- **Inputs**: Versioned template assets in `v1/`.
- **Outputs**: Reusable distro payload.
- **Behavior**: Package the existing assets without changing their intended runtime behavior.

### Capability: Project Generation
Keep the current scaffold value while upgrading it into a product.

#### Feature: Versioned project creation
- **Description**: Generate a new Pi project from a pinned scaffold version.
- **Inputs**: Project name, target directory, template version.
- **Outputs**: Initialized project repo with placeholders replaced.
- **Behavior**: Copy template assets, write metadata, initialize git, and install package deps if available.

#### Feature: Brownfield extension adoption
- **Description**: Let existing repos adopt parts of the distro without full regeneration.
- **Inputs**: Existing repo path, selected asset set.
- **Outputs**: Imported assets and docs.
- **Behavior**: Copy or install only the requested team extensions and supporting files.

### Capability: Release and Validation
Make the distro operationally shippable.

#### Feature: Release packaging
- **Description**: Produce downloadable release artifacts from tagged repo state.
- **Inputs**: Repo tag, version metadata, packaging command.
- **Outputs**: Archive, checksum, release notes inputs.
- **Behavior**: Bundle the distro files and manifest into a reproducible release artifact.

#### Feature: Product smoke testing
- **Description**: Validate install and launch behavior at the product level.
- **Inputs**: Release artifact or working tree, test harness, fake or real toolchain.
- **Outputs**: Pass/fail evidence for ship readiness.
- **Behavior**: Exercise clean install, doctor, wrapper launch, and project generation flows.

## Repository Mapping (High Level)
- `init.sh` and `v1/` remain the foundation for versioned project generation.
- A new install/doctor/wrapper layer becomes the product surface that turns the scaffold into a distro.
- Product tests extend the current `tests/` coverage beyond template generation.
- Release metadata and packaging scripts become first-class repo assets.

## Dependency Chain

### Foundation Layer
- Template assets in `v1/`
- Template generator in `init.sh`
- Existing extension/runtime recipes in `v1/justfile`
- Existing environment guidance in `v1/.env.sample`

### Product Enablement Layer
- Distro version manifest depends on the foundation layer
- Doctor command depends on the manifest and foundation assets
- Wrapper launcher depends on the manifest and doctor checks
- Installer depends on the manifest, foundation assets, and wrapper contract

### Release Layer
- Release packaging depends on installer, doctor, wrapper, and manifest
- Product-level smoke tests depend on release packaging or equivalent working-tree outputs
- Documentation updates depend on the final CLI surface and packaging behavior

## Success Metrics
- 90%+ of internal users can complete install and first launch without manual maintainer help.
- New-user setup time for supported machines is under 15 minutes end to end.
- Doctor identifies and explains the top setup failures without requiring source-code inspection.
- Every tagged release has a reproducible artifact, checksum, and a passing clean-install smoke test.
- Generated projects launch against the pinned Pi contract without version drift surprises.

## Acceptance Criteria
- A maintainer can produce a tagged release artifact that contains the scaffold, distro manifest, installer, doctor, and wrapper launcher.
- A developer on a supported clean macOS or Linux machine can follow the install doc and reach a successful `team-pi` launch.
- If Pi is missing or the wrong version is installed, install or doctor reports the mismatch and the expected fix.
- If required project assets are missing, the wrapper does not continue blindly; it stops with a clear remediation message.
- If provider auth is missing, doctor and first-run behavior identify the missing provider setup path without exposing secret values.
- The current `init.sh` project-generation path still works and writes the version metadata needed by the distro.
- The repo contains automated tests that cover fresh install behavior, doctor behavior, wrapper invocation, and generated-project smoke checks.
- Documentation clearly distinguishes:
  - current-state scaffold behavior
  - target-state team distro behavior
  - full install path versus brownfield extension-only path

## Risks / Assumptions
- Assumption: the fastest path to a working product is to package a pinned upstream Pi runtime contract, not fork Pi itself.
- Assumption: macOS and Linux cover the first team rollout.
- Risk: upstream Pi install/version behavior may change, so the distro needs an explicit compatibility manifest instead of README-only guidance.
- Risk: provider auth remains the main onboarding failure mode even after packaging, so doctor quality is critical.
- Risk: if the wrapper becomes too magical, maintainers may struggle to debug runtime issues; logs and pass-through behavior must stay simple.
