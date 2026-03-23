#!/usr/bin/env bash
#
# Pi Project Scaffold — init.sh
#
# Creates a new Pi project or adds Pi to an existing one (brownfield).
#
# Usage:
#   New Project:        ./init.sh <project-name> [target-parent]
#   Existing Project:   ./init.sh --brownfield [target-dir]
#
set -euo pipefail

SCAFFOLD_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION_DIR="$SCAFFOLD_DIR/scaffold/v1"

# ── Help ───────────────────────────────────────────────────────────────────

show_help() {
  echo "Pi Project Scaffold — Bootstrap or extend your project with Pi."
  echo ""
  echo "Usage:"
  echo "  New Project:      $0 <project-name> [target-parent]"
  echo "  Existing Project: $0 --brownfield [target-dir]"
  echo ""
  echo "Examples:"
  echo "  $0 my-agent              # creates ./my-agent/ from v1 template"
  echo "  $0 --brownfield .        # adds Pi config/extensions to current directory"
  exit 0
}

if [[ $# -lt 1 ]]; then
  show_help
fi

# ── Detect Mode ────────────────────────────────────────────────────────────

BROWNFIELD=false
if [[ "$1" == "--brownfield" ]]; then
  BROWNFIELD=true
  TARGET_DIR="${2:-.}"
  PROJECT_NAME="$(basename "$(cd "$TARGET_DIR" && pwd)")"
else
  PROJECT_NAME="$1"
  TARGET_PARENT="${2:-.}"
  TARGET_DIR="$TARGET_PARENT/$PROJECT_NAME"
fi

# Slugify for package.json name field
PROJECT_SLUG="$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"

# ── Validate ───────────────────────────────────────────────────────────────

if [[ ! -d "$VERSION_DIR" ]]; then
  echo "Error: Scaffold template not found at $VERSION_DIR"
  exit 1
fi

if [[ "$BROWNFIELD" == "false" && -d "$TARGET_DIR" ]]; then
  echo "Error: Directory already exists: $TARGET_DIR. Use --brownfield to add to it."
  exit 1
fi

# ── Copy/Merge ─────────────────────────────────────────────────────────────

if [[ "$BROWNFIELD" == "true" ]]; then
  echo "🛠  Adding Pi to existing project: $PROJECT_NAME"
else
  echo "📁 Creating new project: $PROJECT_NAME"
  mkdir -p "$TARGET_DIR"
fi

echo "   Template: v1 ($(cat "$VERSION_DIR/VERSION"))"
echo "   Target:   $TARGET_DIR"
echo ""

# Assets to copy/merge
# We copy everything, but if brownfield we handle files more carefully
if [[ "$BROWNFIELD" == "true" ]]; then
  # Directories to merge
  for dir in ".pi" ".claude" ".github" "extensions" "bolt-ons"; do
    if [[ -d "$VERSION_DIR/$dir" ]]; then
      echo "   + merging $dir/..."
      cp -R "$VERSION_DIR/$dir" "$TARGET_DIR/"
    fi
  done

  # Files to copy IF they don't exist
  for file in ".env.sample" ".gitignore" "CLAUDE.md" "RESERVED_KEYS.md" "THEME.md" "TOOLS.md" "VERSION"; do
    if [[ -f "$VERSION_DIR/$file" && ! -f "$TARGET_DIR/$file" ]]; then
      echo "   + copying $file"
      cp "$VERSION_DIR/$file" "$TARGET_DIR/"
    fi
  done

  # Handle package.json (merge dependencies manually or append)
  if [[ -f "$TARGET_DIR/package.json" ]]; then
    echo "   + updating package.json (run 'bun install' next)"
    # We should use jq or a simpler approach to merge dependencies if available
    # For now, we'll just suggest it in the output if we don't want to overcomplicate
  else
    cp "$VERSION_DIR/package.json" "$TARGET_DIR/"
  fi

  # Handle justfile (append or copy)
  if [[ -f "$TARGET_DIR/justfile" ]]; then
    echo "   + appending Pi recipes to justfile"
    echo "" >> "$TARGET_DIR/justfile"
    echo "# ── Pi Extension Stacks (Added by Scaffold) ───────────────────────" >> "$TARGET_DIR/justfile"
    cat "$VERSION_DIR/justfile" >> "$TARGET_DIR/justfile"
  else
    cp "$VERSION_DIR/justfile" "$TARGET_DIR/"
  fi

else
  # New project: Full copy
  cp -R "$VERSION_DIR/." "$TARGET_DIR/"
fi

# ── Replace placeholders ──────────────────────────────────────────────────

replace_literal_in_file() {
  local old="$1"
  local new="$2"
  local file="$3"
  # Use perl for safe literal replacement (sed is finicky with slashes/specials)
  OLD="$old" NEW="$new" perl -0pi -e 's/\Q$ENV{OLD}\E/$ENV{NEW}/g' "$file"
}

# README.md and CLAUDE.md use {{PROJECT_NAME}}
while IFS= read -r -d '' file; do
  replace_literal_in_file "{{PROJECT_NAME}}" "$PROJECT_NAME" "$file"
done < <(find "$TARGET_DIR" -maxdepth 2 -type f \( -name "*.md" -o -name "*.json" \) -print0)

# package.json uses {{project-name}} for the slug
if [[ -f "$TARGET_DIR/package.json" ]]; then
  replace_literal_in_file "{{project-name}}" "$PROJECT_SLUG" "$TARGET_DIR/package.json"
fi

# ── Fix pure-focus.ts usage comment path ──────────────────────────────────

if [[ -f "$TARGET_DIR/extensions/pure-focus.ts" ]]; then
  replace_literal_in_file "examples/extensions/pure-focus.ts" "extensions/pure-focus.ts" "$TARGET_DIR/extensions/pure-focus.ts"
fi

# ── Post-Setup Actions ─────────────────────────────────────────────────────

cd "$TARGET_DIR"

if [[ "$BROWNFIELD" == "false" ]]; then
  if [[ ! -d ".git" ]]; then
    git init -q
    echo "   initialized git"
  fi
fi

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
if [[ ! -f ".env" ]]; then
  echo "  cp .env.sample .env     # add your API keys"
fi
echo "  source .env && pi       # start Pi"
echo "  just pi                 # or use recipes"
echo ""
