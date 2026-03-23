# Pi Project Scaffold

Versioned project templates for bootstrapping new Pi Coding Agent codebases.

This repository is a scaffold product, not a bundled Pi distribution.

What it does:
- ships a versioned template under `v1/`
- generates a new Pi-based project via `init.sh`
- packages extensions, agents, themes, prompts, CI, and docs into the generated repo

What it does not do:
- bundle the upstream `pi` CLI
- pin or install the Pi runtime for users
- provide a one-command team distro installer

Current PRD source of truth:
- `docs/prd-scaffold-rpg.txt`

Companion technical design:
- `docs/tdd-scaffold.md`

Canonical full team distro planning set:
- `docs/prd-company-pi-distro-rpg.txt`
- `docs/tdd-company-pi-distro.md`

Team rollout docs:
- `docs/ONBOARDING.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/PUBLISH_V1.md`

Historical exploratory distro docs remain for reference only:
- `docs/prd-team-distro.md`
- `docs/tdd-team-distro.md`

## Layout

- `v1/` — current scaffold template
- `init.sh` — creates a new project from a scaffold version

## Usage

```bash
./init.sh my-new-project
./init.sh my-new-project ~/projects
```

This will:
1. copy `v1/` into the target directory
2. replace template placeholders
3. initialize a git repository
4. run `bun install` if Bun is available

The generated project still expects `pi`, `bun`, and `just` to exist on the local machine.

## Team Rollout

For teammates using the scaffold tomorrow:
- they should clone the exported `v1` starter repo
- follow `docs/ONBOARDING.md`
- start with `just ext-health-check` or `just ext-minimal`

For maintainers cutting a release or rollout:
- run `npm test`
- export the starter repo with `./scripts/export-v1.sh <project-name> <target-dir>`
- follow `docs/PUBLISH_V1.md`
- use `docs/RELEASE_CHECKLIST.md` before tagging or announcing a release

## Versioning Strategy

When the scaffold evolves in a meaningful way:
- copy `v1/` to `v2/`
- update `v2/VERSION`
- make changes in the new directory only
- keep older versions intact for reproducible project creation

## Placeholder Tokens

- `{{PROJECT_NAME}}` — human-readable project name
- `{{project-name}}` — slug used in `package.json`
