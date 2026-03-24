# Pi Swarm Release Plan

This document outlines the steps to sanitize, organize, and clean up the Pi Swarm repository for public and employee release.

## 1. Goal
Prepare the `pi-swarm` repository for public and internal distribution by ensuring it is clean, consistent, and easy to maintain.

## 2. Current State Analysis
- **Redundancy**: Root directory and `scaffold/v1/` contain duplicate copies of core assets (`extensions/`, `specs/`, `bin/`, `bolt-ons/`, etc.).
- **Drift**: Files in root and `v1/` have diverged (e.g., license headers, slight logic changes).
- **Sanitation**: Absolute paths (e.g., ``) exist in READMEs and configs.
- **Versioning**: `just release` only updates the root, not the scaffold template.
- **Documentation**: Root documentation contains internal references that may need generalization for public release.

## 3. Organization & Clean Up Strategy

### Unified Source of Truth
We will establish the **Root Directory** as the primary development source. The `scaffold/v1/` directory will be treated as a *derived* template directory.

### Automation: `just sync-v1`
Create a new command to synchronize the current root state into the `scaffold/v1/` directory. This command will:
1.  Copy all core directories (`extensions`, `specs`, `bin`, `.pi`, `bolt-ons`, `images`, `.github`).
2.  Sanitize files (replace absolute paths with relative ones or placeholders).
3.  Ensure all source files have the MIT License header.
4.  Copy and sanitize `package.json`, `justfile`, and `README.md`.

### Clean Up Root
1.  Remove stray or redundant files from the root.
2.  Ensure `.gitignore` is comprehensive.

## 4. Sanitation Checklist
- [ ] **Secrets**: Confirm `.env.sample` files are clean.
- [ ] **Absolute Paths**: Replace `` with relative paths in all files.
- [ ] **License Headers**: Apply the standard MIT header to all `.ts` and `.sh` files.
- [ ] **Internal Docs**: Review `docs/ONBOARDING_FOR_EMPLOYEES.md` and other files for sensitive info.

## 5. Release Workflow (The Plan)

### Step 1: Sanitation
1.  Run a script to replace absolute paths.
2.  Review and clean `.env.sample`.
3.  Add license headers to all files.

### Step 2: Synchronization
1.  Implement `just sync-v1`.
2.  Run `just sync-v1` to refresh the scaffold template.

### Step 3: Versioning
1.  Update the `release` recipe in the root `justfile` to update BOTH root and `scaffold/v1/` versions.
2.  Tag the release.

### Step 4: Verification
1.  Run E2E tests: `just test`.
2.  Perform a "Clean-Machine Smoke Check" as per `scaffold/docs/RELEASE_CHECKLIST.md`.

### Step 5: Distribution
1.  **Public**: Push to the public GitHub repository.
2.  **Employees**: Notify employees to clone the repo and follow `docs/ONBOARDING_FOR_EMPLOYEES.md`.

## 6. Target Milestone: v1.3.0
The first clean, organized, and sanitized release.
