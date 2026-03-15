#!/usr/bin/env bash
#
# Pi Project Scaffold — init.sh
#
# Creates a new Pi Coding Agent project from the versioned scaffold template.
#
# Usage:
#   ./scaffold/init.sh <project-name> [target-dir]
#
# Examples:
#   ./scaffold/init.sh my-agent              # creates ./my-agent/
#   ./scaffold/init.sh my-agent ~/projects   # creates ~/projects/my-agent/
#
set -euo pipefail

SCAFFOLD_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION_DIR="$SCAFFOLD_DIR/v1"

# ── Args ───────────────────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <project-name> [target-dir]"
  echo ""
  echo "  project-name   Name for the new project (used in package.json, README, CLAUDE.md)"
  echo "  target-dir     Parent directory (default: current directory)"
  exit 1
fi

PROJECT_NAME="$1"
TARGET_PARENT="${2:-.}"
TARGET_DIR="$TARGET_PARENT/$PROJECT_NAME"

# Slugify for package.json name field
PROJECT_SLUG="$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"

# ── Validate ───────────────────────────────────────────────────────────────

if [[ ! -d "$VERSION_DIR" ]]; then
  echo "Error: Scaffold template not found at $VERSION_DIR"
  exit 1
fi

if [[ -d "$TARGET_DIR" ]]; then
  echo "Error: Directory already exists: $TARGET_DIR"
  exit 1
fi

# ── Copy ───────────────────────────────────────────────────────────────────

echo "📁 Creating project: $PROJECT_NAME"
echo "   Template: v1 ($(cat "$VERSION_DIR/VERSION"))"
echo "   Target:   $TARGET_DIR"
echo ""

cp -R "$VERSION_DIR" "$TARGET_DIR"

# ── Replace placeholders ──────────────────────────────────────────────────

# README.md and CLAUDE.md use {{PROJECT_NAME}}
find "$TARGET_DIR" -type f \( -name "*.md" -o -name "*.json" \) -exec \
  sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" {} +

# package.json uses {{project-name}} for the slug
find "$TARGET_DIR" -type f -name "package.json" -exec \
  sed -i '' "s/{{project-name}}/$PROJECT_SLUG/g" {} +

# ── Fix pure-focus.ts usage comment path ──────────────────────────────────

if [[ -f "$TARGET_DIR/extensions/pure-focus.ts" ]]; then
  sed -i '' 's|examples/extensions/pure-focus.ts|extensions/pure-focus.ts|' "$TARGET_DIR/extensions/pure-focus.ts"
fi

# ── Init git ──────────────────────────────────────────────────────────────

cd "$TARGET_DIR"
git init -q
echo ""

# ── Install deps ──────────────────────────────────────────────────────────

if command -v bun &>/dev/null; then
  echo "📦 Installing dependencies with bun..."
  bun install --silent
else
  echo "⚠️  bun not found — run 'bun install' manually after installing bun"
fi

# ── Done ──────────────────────────────────────────────────────────────────

echo ""
echo "✅ Project ready: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  cd $TARGET_DIR"
echo "  cp .env.sample .env     # add your API keys"
echo "  source .env && pi       # or: just pi"
echo ""
