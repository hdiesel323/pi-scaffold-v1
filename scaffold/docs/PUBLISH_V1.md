# Publish V1 For The Team

Use this when you want teammates to clone a ready-to-use Pi starter repo tomorrow.

This is the correct rollout model:

- maintainers work from the scaffold repo
- maintainers export the current `v1/` template into a standalone starter repo
- teammates clone the exported starter repo, not the scaffold repo

## 1. Verify The Scaffold

From the scaffold repo root:

```bash
npm test
```

Do not publish `v1` if the scaffold test suite is failing.

## 2. Export The Starter Repo

Generate a standalone repo from the current `v1/` template:

```bash
./scripts/export-v1.sh team-pi ~/tmp
cd ~/tmp/team-pi
```

This will:

1. copy `v1/` into a new target directory
2. replace template placeholders
3. initialize a new git repository
4. run `bun install` if Bun is available

## 3. Smoke Check The Export

Inside the exported repo:

```bash
cp .env.sample .env
# add at least one working provider key
just ext-health-check
```

If that works, the exported repo is good enough for teammate onboarding.

## 4. Push The Starter Repo

Inside the exported repo:

```bash
git remote add origin <new-team-repo-url>
git add .
git commit -m "Initial Pi v1 starter from scaffold"
git branch -M main
git push -u origin main
```

Optional but recommended:

```bash
git tag v1-team-YYYY-MM-DD
git push origin v1-team-YYYY-MM-DD
```

## 5. Send This To The Team

Use a message like this:

```text
Clone this repo: <new-team-repo-url>

Prereqs:
- pi
- bun
- just

Then run:
cp .env.sample .env
# add your provider key(s)
bun install
just ext-health-check
```

## Boundaries

- The scaffold repo is still the source template.
- The exported starter repo is what teammates should clone tomorrow.
- This is still `v1` Pi, but it is being published as a generated repo, not as a bundled runtime distro.
