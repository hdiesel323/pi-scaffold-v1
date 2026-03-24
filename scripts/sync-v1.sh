#!/usr/bin/env bash
#
# Pi Swarm
# License: MIT
# Copyright (c) 2026 Pi Scaffold Maintainers
#
# sync-v1.sh — Sync root source files to scaffold/v1/ template
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
V1_DIR="$ROOT_DIR/scaffold/v1"

echo "=== Syncing Source of Truth to scaffold/v1/ ==="

sync_dir() {
  local dir="$1"
  if [[ -d "$ROOT_DIR/$dir" ]]; then
    echo "  Syncing $dir/..."
    mkdir -p "$V1_DIR/$dir"
    # Use rsync if available for efficiency, otherwise cp
    if command -v rsync &>/dev/null; then
      rsync -av --delete --exclude 'node_modules' --exclude '.git' "$ROOT_DIR/$dir/" "$V1_DIR/$dir/"
    else
      rm -rf "$V1_DIR/$dir"
      cp -RL "$ROOT_DIR/$dir" "$V1_DIR/"
    fi
  fi
}

sync_file() {
  local file="$1"
  if [[ -f "$ROOT_DIR/$file" ]]; then
    echo "  Syncing $file..."
    rm -f "$V1_DIR/$file"
    cp -L "$ROOT_DIR/$file" "$V1_DIR/$file"
  fi
}

# Directories to sync
sync_dir ".pi"
sync_dir ".claude"
sync_dir ".github"
sync_dir "bin"
sync_dir "extensions"
sync_dir "bolt-ons"
sync_dir "specs"
sync_dir "images"

# Files to sync
sync_file ".env.sample"
sync_file ".gitignore"
sync_file "CLAUDE.md"
sync_file "RESERVED_KEYS.md"
sync_file "THEME.md"
sync_file "TOOLS.md"
sync_file "VERSION"
sync_file "doctor.sh"
sync_file "justfile"

# Documentation is special, we only want some files
echo "  Syncing docs/..."
mkdir -p "$V1_DIR/docs"
cp -L "$ROOT_DIR/docs/TRANSITION.md" "$V1_DIR/docs/"
cp -L "$ROOT_DIR/docs/ZETTELKASTEN.md" "$V1_DIR/docs/"

# Final sanity checks
# The scaffold/v1/package.json is slightly different from root, so we don't sync it blindly.
# It should have its own version and dependencies.
# We'll keep the scaffold/v1/README.md as is since it's a template.

echo ""
echo "✅ Sync complete."
echo "   Source of truth: $ROOT_DIR"
echo "   Template target: $V1_DIR"
