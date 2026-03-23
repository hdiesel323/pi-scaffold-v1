#!/usr/bin/env bash
#
# Export the current v1 scaffold template as a standalone starter repo.
#
# Usage:
#   ./scripts/export-v1.sh <project-name> [target-dir]
#
# Example:
#   ./scripts/export-v1.sh team-pi ~/tmp
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCAFFOLD_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <project-name> [target-dir]"
  echo ""
  echo "  project-name   Name of the standalone starter repo to generate"
  echo "  target-dir     Parent directory for the exported repo (default: current directory)"
  exit 0
fi

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: $0 <project-name> [target-dir]"
  echo ""
  echo "  project-name   Name of the standalone starter repo to generate"
  echo "  target-dir     Parent directory for the exported repo (default: current directory)"
  exit 0
fi

if [[ $# -gt 2 ]]; then
  echo "Usage: $0 <project-name> [target-dir]"
  exit 1
fi

PROJECT_NAME="$1"
TARGET_PARENT="${2:-.}"
TARGET_DIR="$TARGET_PARENT/$PROJECT_NAME"

"$SCAFFOLD_DIR/init.sh" "$PROJECT_NAME" "$TARGET_PARENT"

echo ""
echo "Standalone v1 starter repo exported to: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  cd $TARGET_DIR"
echo "  git remote add origin <new-repo-url>"
echo "  git add ."
echo "  git commit -m \"Initial Pi v1 starter from scaffold\""
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
