# Scaffold Release Checklist

Use this checklist before tagging or announcing a scaffold release. This applies to the current scaffold product only, not the future distro work.

## Product Scope
- [ ] Root README states the repo is a scaffold product, not a bundled Pi distribution.
- [ ] `docs/prd-scaffold-rpg.txt` is still the source of truth for current product scope.
- [ ] `docs/tdd-scaffold.md` matches the PRD and does not introduce distro-only assumptions.
- [ ] `v1/README.md` still describes the generated project template boundary clearly.
- [ ] Future-state distro docs remain labeled as future-state only.

## Versioning Discipline
- [ ] If the change is meaningful, it lands in a new `vN/` directory instead of mutating old versions in place.
- [ ] `v1/VERSION` is updated only when the active template version changes.
- [ ] Root docs mention the current scaffold version accurately.
- [ ] Any placeholder changes are reflected in `init.sh`, the template files, and tests together.
- [ ] Old version directories remain untouched and reproducible.

## Template Integrity
- [ ] `init.sh` still copies the active version directory into a new target repo.
- [ ] Placeholder replacement still works for `pi-swarm` and `{{project-name}}`.
- [ ] Generated projects still include the expected hidden assets: `.pi/`, `.claude/`, and `.github/`.
- [ ] `v1/justfile` still points at the documented extension stacks.
- [ ] `v1/.env.sample` still matches the documented provider guidance.

## Test Gate
- [ ] `node --test tests/e2e.test.mjs` passes locally.
- [ ] The E2E suite still covers:
  - [ ] missing required args
  - [ ] existing target directory rejection
  - [ ] full scaffold generation
  - [ ] recipe wiring for the documented extension stacks
  - [ ] Bun bootstrap behavior
  - [ ] generated docs and CI structure
  - [ ] optional bolt-on compatibility
  - [ ] local Pi model discovery smoke checks when Pi is installed
- [ ] Any new scaffold behavior has a matching test.

## Clean-Machine Smoke Check
- [ ] Generate a fresh project in a clean temporary directory.
- [ ] Confirm the generated repo initializes successfully.
- [ ] Confirm the generated repo contains the expected files and hidden directories.
- [ ] Confirm `bun install` behavior is acceptable on a machine with Bun installed.
- [ ] Confirm the documented `just` recipes execute against a stubbed `pi` binary.
- [ ] Confirm the generated README does not leave template tokens behind.

## Release Steps
- [ ] Review the diff for scope creep into runtime packaging or distro work.
- [ ] Confirm the checklist is green with a local E2E run.
- [ ] Update version metadata if the scaffold version changed.
- [ ] Export a fresh starter repo with `./scripts/export-v1.sh <project-name> <target-dir>`.
- [ ] Run a real smoke check inside the exported repo.
- [ ] Create the release tag from the verified commit.
- [ ] Publish or attach the release notes describing only scaffold changes.
- [ ] Push the exported starter repo to its own remote.
- [ ] Notify the team which exported starter repo to clone.

## Do Not Ship If
- [ ] The docs describe the repo as a full Pi distro.
- [ ] A new version was introduced by mutating an older version directory.
- [ ] E2E tests fail or are skipped without an explicit reason.
- [ ] The generated project is missing hidden assets or recipe wiring.
- [ ] The release notes mention unimplemented distro behavior.

## Quick Sign-Off
- [ ] Product scope is correct.
- [ ] Versioning is disciplined.
- [ ] Tests are green.
- [ ] Clean-machine smoke check passed.
- [ ] Tag and release are ready.
