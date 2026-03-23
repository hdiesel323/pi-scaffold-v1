#!/usr/bin/env bash
# Pi Swarm
# License: MIT
# Copyright (c) 2026 Pi Swarm Maintainers
#
# Pi Team Distro — doctor.sh
#
# Diagnoses the local environment for Pi team compatibility.
#
set -euo pipefail

# ── Version ────────────────────────────────────────────────────────────────

VERSION="1.2.0"

# ── Colors ─────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}info${NC}    $1"; }
success() { echo -e "${GREEN}success${NC} $1"; }
warn()    { echo -e "${YELLOW}warn${NC}    $1"; }
error()   { echo -e "${RED}error${NC}   $1"; }

# ── Args ───────────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--version" ]]; then
  echo "Pi Swarm v$VERSION"
  exit 0
fi

# ── Helpers ────────────────────────────────────────────────────────────────

EXIT_CODE=0

check_command() {
  local cmd="$1"
  local min_version="$2"
  local msg="$3"
  local version_cmd="$4"

  if command -v "$cmd" &>/dev/null; then
    if [[ -n "$version_cmd" ]]; then
        local current_version
        current_version=$($version_cmd 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || echo "0.0.0")
        
        if [[ -n "$min_version" && "$current_version" != "0.0.0" ]]; then
            # Simple version comparison
            if [[ "$(printf '%s\n%s' "$min_version" "$current_version" | sort -V | head -n1)" == "$min_version" ]]; then
                success "$cmd is installed ($current_version)"
            else
                warn "$cmd version is $current_version, but >= $min_version is recommended."
                info "  Upgrade with: $msg"
            fi
        else
            success "$cmd is installed ($(command -v "$cmd"))"
        fi
    else
        success "$cmd is installed ($(command -v "$cmd"))"
    fi
  else
    error "$cmd is missing — $msg"
    EXIT_CODE=1
  fi
}

echo "🏥 Pi Swarm Doctor"
echo "────────────────────────────────"

# 1. Platform
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
if [[ "$OS" == "darwin" || "$OS" == "linux" ]]; then
  success "Platform is supported ($OS)"
else
  warn "Platform may not be fully supported ($OS)"
fi

# 2. Tools
check_command "pi" "0.1.0" "go install github.com/mariozechner/pi-coding-agent@latest" "pi --version"
check_command "bun" "1.0.0" "curl -fsSL https://bun.sh/install | bash" "bun --version"
check_command "just" "1.0.0" "brew install just" "just --version"
check_command "gh" "" "brew install gh" "gh --version"
check_command "sqlite3" "" "brew install sqlite" "sqlite3 --version"

# 3. Environment / Auth
AUTH_FOUND=false

# 3a. Check for OAuth (Recommended)
if [[ -f "$HOME/.pi/agent/auth.json" ]]; then
  success "OAuth configuration found in ~/.pi/agent/auth.json"
  AUTH_FOUND=true
fi

# 3b. Check for API Keys in .env
if [[ -f ".env" ]]; then
  # Check for common provider keys (without printing them!)
  FOUND_KEYS=0
  for key in ANTHROPIC_API_KEY OPENAI_API_KEY GOOGLE_GENERATIVE_AI_API_KEY GEMINI_API_KEY; do
    if grep -q "^$key=" .env; then
      ((FOUND_KEYS++))
    fi
  done
  if [[ $FOUND_KEYS -gt 0 ]]; then
    success "Found $FOUND_KEYS provider API keys in .env"
    AUTH_FOUND=true
  fi
fi

if [[ "$AUTH_FOUND" == "false" ]]; then
  warn "No authentication found."
  info "  Option 1 (OAuth): Run '/login <provider>' inside Pi (e.g. /login anthropic)"
  info "  Option 2 (API Key): Add keys to .env (see .env.sample)"
else
  success "Authentication is configured."
fi

# 4. Project Assets
for dir in .pi extensions; do
  if [[ -d "$dir" ]]; then
    success "$dir/ directory found"
  else
    error "$dir/ directory missing — this repo may be incomplete"
    EXIT_CODE=1
  fi
done

echo "────────────────────────────────"
if [[ $EXIT_CODE -eq 0 ]]; then
  success "Environment looks good! Run 'just team-pi' to start."
else
  error "Found issues that may prevent Pi from working correctly."
fi

exit $EXIT_CODE
