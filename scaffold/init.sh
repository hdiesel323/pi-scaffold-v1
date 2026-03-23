#!/usr/bin/env bash
# Pi Swarm
# License: MIT
# Copyright (c) 2026 Pi Scaffold Maintainers
# Pi Swarm
# License: MIT
# Copyright (c) 2026 Pi Scaffold Maintainers
#
# Pi Project Scaffold — init.sh (Wrapper)
#
# DEPRECATED: This script is a wrapper for the root init.sh.
# Please use the root init.sh directly in the future.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_INIT="$SCRIPT_DIR/../init.sh"

echo "⚠️  DEPRECATION WARNING: scaffold/init.sh is deprecated."
echo "   Redirecting to root init.sh..."
echo ""

exec "$ROOT_INIT" "$@"
