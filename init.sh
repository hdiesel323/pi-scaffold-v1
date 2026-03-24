#!/usr/bin/env bash
#
# Pi Swarm — init.sh
#
# Creates a new Pi project or adds Pi to an existing one (brownfield).
#
set -euo pipefail

SCAFFOLD_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION_DIR="$SCAFFOLD_DIR/scaffold/v1"

# ── Colors ─────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Help ───────────────────────────────────────────────────────────────────

show_help() {
  echo "Pi Swarm — Bootstrap or extend your project with Pi."
  echo ""
  echo "Usage:"
  echo "  New Project:      $0 <project-name> [target-parent]"
  echo "  Existing Project: $0 --brownfield [target-dir]"
  echo "  Dry Run:          $0 [--brownfield] --dry-run [target]"
  echo ""
  echo "Examples:"
  echo "  $0 my-agent              # creates ./my-agent/ from v1 template"
  echo "  $0 --brownfield .        # adds Pi config/extensions to current directory"
  echo "  $0 --dry-run my-agent    # simulate creation of new project"
  exit 0
}

if [[ $# -lt 1 ]]; then
  show_help
fi

# ── Detect Mode ────────────────────────────────────────────────────────────

BROWNFIELD=false
DRY_RUN=false
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --brownfield)
      BROWNFIELD=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      show_help
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

if [[ "$BROWNFIELD" == "true" ]]; then
  TARGET_DIR="${POSITIONAL_ARGS[0]:-.}"
  PROJECT_NAME="$(basename "$(cd "$TARGET_DIR" 2>/dev/null && pwd || echo "$TARGET_DIR")")"
else
  if [[ ${#POSITIONAL_ARGS[@]} -lt 1 ]]; then
    show_help
  fi
  PROJECT_NAME="${POSITIONAL_ARGS[0]}"
  TARGET_PARENT="${POSITIONAL_ARGS[1]:-.}"
  TARGET_DIR="$TARGET_PARENT/$PROJECT_NAME"
fi

PROJECT_SLUG="$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"

# ── Stats ──────────────────────────────────────────────────────────────────

FILES_COPIED=0
DIRS_MERGED=0
PKG_UPDATED="no"
JUST_AUGMENTED="no"

log_action() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "   ${YELLOW}[DRY-RUN]${NC} $1"
  else
    echo "   $1"
  fi
}

# ── Validate ───────────────────────────────────────────────────────────────

if [[ ! -d "$VERSION_DIR" ]]; then
  echo "Error: Scaffold template not found at $VERSION_DIR"
  exit 1
fi

if [[ "$BROWNFIELD" == "false" && -d "$TARGET_DIR" && "$DRY_RUN" == "false" ]]; then
  echo "Error: Directory already exists: $TARGET_DIR. Use --brownfield to add to it."
  exit 1
fi

# ── Copy/Merge ─────────────────────────────────────────────────────────────

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "🔍 ${YELLOW}Dry Run: Simulating actions for project $PROJECT_NAME${NC}"
fi

if [[ "$BROWNFIELD" == "true" ]]; then
  echo -e "🛠  ${BLUE}Adding Pi to existing project: $PROJECT_NAME${NC}"
else
  echo -e "📁 ${BLUE}Creating new project: $PROJECT_NAME${NC}"
  if [[ "$DRY_RUN" == "false" ]]; then
    mkdir -p "$TARGET_DIR"
  fi
fi

echo "   Template: v1 ($(cat "$VERSION_DIR/VERSION"))"
echo "   Target:   $TARGET_DIR"
echo ""

if [[ "$BROWNFIELD" == "true" ]]; then
  for dir in ".pi" ".claude" ".github" "bin" "extensions" "bolt-ons" "specs"; do
    if [[ -d "$VERSION_DIR/$dir" ]]; then
      log_action "+ merging $dir/..."
      ((DIRS_MERGED++))
      if [[ "$DRY_RUN" == "false" ]]; then
        cp -RL "$VERSION_DIR/$dir" "$TARGET_DIR/"
      fi
    fi
  done

  for file in ".env.sample" ".gitignore" "CLAUDE.md" "RESERVED_KEYS.md" "THEME.md" "TOOLS.md" "VERSION" "doctor.sh"; do
    if [[ -f "$VERSION_DIR/$file" ]]; then
      if [[ ! -f "$TARGET_DIR/$file" ]]; then
        log_action "+ copying $file"
        ((FILES_COPIED++))
        if [[ "$DRY_RUN" == "false" ]]; then
          cp -L "$VERSION_DIR/$file" "$TARGET_DIR/"
        fi
      else
        log_action "○ skipping $file (already exists)"
      fi
    fi
  done

  if [[ -f "$TARGET_DIR/package.json" ]]; then
    log_action "+ updating package.json (run 'bun install' next)"
    PKG_UPDATED="yes (manual install required)"
  else
    log_action "+ copying package.json"
    ((FILES_COPIED++))
    if [[ "$DRY_RUN" == "false" ]]; then
      cp -L "$VERSION_DIR/package.json" "$TARGET_DIR/"
    fi
  fi

  if [[ -f "$TARGET_DIR/justfile" ]]; then
    if grep -q "# ── Pi Extension Stacks" "$TARGET_DIR/justfile"; then
      log_action "○ skipping justfile append (already present)"
    else
      log_action "+ appending Pi recipes to justfile"
      JUST_AUGMENTED="yes"
      if [[ "$DRY_RUN" == "false" ]]; then
        {
          echo ""
          echo "# ── Pi Extension Stacks (Added by Scaffold) ───────────────────────"
          tail -n +6 "$VERSION_DIR/justfile"
        } >> "$TARGET_DIR/justfile"
      fi
    fi
  else
    log_action "+ copying justfile"
    ((FILES_COPIED++))
    if [[ "$DRY_RUN" == "false" ]]; then
      cp -L "$VERSION_DIR/justfile" "$TARGET_DIR/"
    fi
  fi

else
  log_action "+ copying all template files"
  if [[ "$DRY_RUN" == "false" ]]; then
    cp -RL "$VERSION_DIR/." "$TARGET_DIR/"
  fi
  FILES_COPIED="all"
fi

# ── Replace placeholders ──────────────────────────────────────────────────

replace_literal_in_file() {
  local old="$1"
  local new="$2"
  local file="$3"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "   ${YELLOW}[DRY-RUN]${NC} replace '$old' with '$new' in $file"
  else
    OLD="$old" NEW="$new" perl -0pi -e 's/\Q$ENV{OLD}\E/$ENV{NEW}/g' "$file"
  fi
}

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "   ${YELLOW}[DRY-RUN]${NC} scan for {{PROJECT_NAME}} placeholders in .md and .json files"
  echo -e "   ${YELLOW}[DRY-RUN]${NC} replace {{project-name}} with $PROJECT_SLUG in package.json"
  echo -e "   ${YELLOW}[DRY-RUN]${NC} fix extension path in extensions/pure-focus.ts"
else
  while IFS= read -r -d '' file; do
    replace_literal_in_file "{{PROJECT_NAME}}" "$PROJECT_NAME" "$file"
  done < <(find "$TARGET_DIR" -maxdepth 3 -type f \( -name "*.md" -o -name "*.json" \) -print0)

  if [[ -f "$TARGET_DIR/package.json" ]]; then
    replace_literal_in_file "{{project-name}}" "$PROJECT_SLUG" "$TARGET_DIR/package.json"
  fi

  if [[ -f "$TARGET_DIR/extensions/pure-focus.ts" ]]; then
    replace_literal_in_file "examples/extensions/pure-focus.ts" "extensions/pure-focus.ts" "$TARGET_DIR/extensions/pure-focus.ts"
  fi
fi

# ── Post-Setup Actions ─────────────────────────────────────────────────────

if [[ "$DRY_RUN" == "true" ]]; then
  log_action "simulate git init"
  log_action "simulate bun install"
  echo -e "\n${GREEN}✅ Dry run complete. No changes were made.${NC}"
  exit 0
fi

cd "$TARGET_DIR"

if [[ "$BROWNFIELD" == "false" && ! -d ".git" ]]; then
  git init -q
  log_action "initialized git"
fi

if command -v bun &>/dev/null; then
  echo "📦 Installing dependencies with bun..."
  bun install --silent
else
  echo -e "${YELLOW}⚠️  bun not found — run 'bun install' manually after installing bun${NC}"
fi

# ── Summary ────────────────────────────────────────────────────────────────

echo -e "\n${GREEN}✅ Project ready: $TARGET_DIR${NC}"
echo "----------------------------------------"
echo "Summary of changes:"
echo "  Files created:    $FILES_COPIED"
echo "  Dirs merged:      $DIRS_MERGED"
echo "  package.json:     $PKG_UPDATED"
echo "  justfile:         $JUST_AUGMENTED"
echo "----------------------------------------"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET_DIR"
if [[ ! -f ".env" ]]; then
  echo "  2. cp .env.sample .env     # add your API keys"
fi
echo "  3. source .env && pi       # start Pi"
echo "  4. just pi                 # or use recipes"
echo ""
