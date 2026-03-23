# Team Onboarding

Use this if you were given a ready-to-clone Pi starter repo generated from the scaffold's `v1/` template.

You should be working from the exported starter repo, not from the scaffold repo itself.

The starter repo does not bundle the `pi` CLI or replace your local toolchain.

## What You Need

- `git`
- `bun`
- `just`
- `pi`

If you are on macOS, install `bun` from [bun.sh](https://bun.sh) and `just` with Homebrew:

```bash
brew install just
```

Install `pi` separately using the upstream Pi Agent docs.

## Clone The Team Repo

```bash
git clone <team-starter-repo-url>
cd <repo-name>
```

## Configure Environment

Copy the sample env file and add your provider keys:

```bash
cp .env.sample .env
```

Minimum things to check in `.env`:

- at least one provider key your team uses
- `SENTRY_DSN` if you want error tracking
- any provider-specific keys required by the recipes you plan to run

## Install Project Dependencies

If Bun is installed, make sure dependencies are present:

```bash
bun install
```

## Run Recipes

Use `just` to launch the packaged Pi extension stacks:

```bash
just ext-minimal
just ext-agent-team
just ext-health-check
just ext-sentry-agent-team
```

If you want the raw runtime, use:

```bash
just pi
```

## What To Expect

- `ext-minimal` gives a lightweight starting point.
- `ext-agent-team` launches the team dispatcher stack.
- `ext-health-check` is the fastest way to confirm the scaffold is wired correctly.
- `ext-sentry-agent-team` adds error tracking on top of the team dispatcher.

## Troubleshooting

- If clone or setup instructions do not match what you received, ask which exported `v1` repo is the approved one.
- If `bun install` does not run, install Bun manually and rerun it inside the project.
- If `just` cannot find `pi`, install `pi` and confirm it is on your `PATH`.
- If a recipe starts but models do not show up, run `pi --list-models` and verify your provider keys are present in `.env`.
- If you are unsure whether the starter repo is wired correctly, run `just ext-health-check` first.

## Boundary

This starter repo comes from the scaffold's `v1/` template. It is not a bundled Pi distro product. The scaffold remains the source for generating future starter repos.
