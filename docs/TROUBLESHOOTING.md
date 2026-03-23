# Troubleshooting Guide

This guide covers common issues encountered while setting up or using Pi Scaffold.

## Tooling Issues

### `pi` command not found
**Symptom**: `bash: pi: command not found` or `doctor.sh` reports `pi` is missing.
**Fix**: Ensure Pi is installed via Go:
```bash
go install github.com/mariozechner/pi-coding-agent@latest
```
Add `~/go/bin` to your `PATH` if it isn't already there.

### `bun` or `just` missing
**Symptom**: Errors when running `init.sh` or `just` recipes.
**Fix**:
- **Bun**: Install from [bun.sh](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`).
- **Just**: Install via your package manager (e.g., `brew install just`).

## Environment & Auth

### Missing API Keys
**Symptom**: Pi starts but fails to generate responses or `doctor.sh` warns about missing authentication.
**Fix**:
1. Copy the sample env: `cp .env.sample .env`.
2. Fill in your provider keys (e.g., `ANTHROPIC_API_KEY`).
3. Ensure you source the file: `source .env`.

### OAuth Token Expired
**Symptom**: `doctor.sh` reports OAuth found, but Pi fails to authenticate with providers.
**Fix**: Re-login inside a Pi session:
```bash
/login anthropic
```

## Initialization & File System

### `init.sh` Permission Denied
**Symptom**: `bash: ./init.sh: Permission denied`.
**Fix**: Grant execution permissions:
```bash
chmod +x init.sh
```

### Extension Import Errors
**Symptom**: `error: Cannot find module '@mariozechner/pi-tui'` during startup.
**Fix**: Ensure dependencies are installed in your project root:
```bash
bun install
```
If you are developing a new extension, ensure any new dependencies are added to `package.json`.

## Diagnostics

### `just doctor` fails
**Symptom**: The diagnostic tool shows red errors.
**Fix**: `doctor.sh` is designed to be self-explanatory. Read the specific error message provided. Usually, it's a missing directory (`extensions/`, `.pi/`) or a missing tool.

If you've manually deleted files, you may need to run `init.sh --brownfield .` again to restore the standard configuration.

---

For further help, please check the [Pi Coding Agent Documentation](https://github.com/mariozechner/pi-coding-agent).
