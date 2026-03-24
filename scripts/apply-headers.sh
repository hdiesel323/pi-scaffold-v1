#!/usr/bin/env bash
#
# Apply MIT license headers to all source files.
# Idempotent: won't add it if it's already there.
#

set -euo pipefail

HEADER="/**
 * Pi Swarm
 * License: MIT
 * Copyright (c) 2026 Pi Scaffold Maintainers
 */"

SH_HEADER="# Pi Swarm
# License: MIT
# Copyright (c) 2026 Pi Scaffold Maintainers"

apply_ts_header() {
  local file="$1"
  if ! grep -q "Pi Swarm" "$file"; then
    echo "Applying header to $file"
    echo -e "$HEADER\n$(cat "$file")" > "$file"
  fi
}

apply_sh_header() {
  local file="$1"
  if ! grep -q "Pi Swarm" "$file"; then
    echo "Applying header to $file"
    # For shell scripts, we need to handle the shebang
    if head -n 1 "$file" | grep -q "^#!"; then
      local shebang=$(head -n 1 "$file")
      echo -e "$shebang\n$SH_HEADER\n$(tail -n +2 "$file")" > "$file"
    else
      echo -e "$SH_HEADER\n$(cat "$file")" > "$file"
    fi
  fi
}

# Find all .ts files in extensions, specs, and tests
find extensions specs tests scaffold/v1/extensions scaffold/v1/specs -name "*.ts" -o -name "*.js" | while read -r file; do
  apply_ts_header "$file"
done

# Find all .sh files and doctor.sh
find bin scripts scaffold/scripts -name "*.sh" | while read -r file; do
  apply_sh_header "$file"
done

apply_sh_header "doctor.sh"
apply_sh_header "init.sh"
apply_sh_header "scaffold/init.sh"
