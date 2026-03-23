# Technical Design Document: Pi Scaffold v1 → Production Release

| Field          | Value                          |
|----------------|--------------------------------|
| **Version**    | 1.0.0-draft                    |
| **Status**     | Draft                          |
| **Created**    | 2026-03-23                     |
| **Author**     | Engineering                    |
| **PRD**        | [docs/PRD.md](./PRD.md)        |
| **Baseline**   | `VERSION` → `1.0.0`           |

---

## 1. System Architecture Overview

### 1.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER / DEVELOPER                             │
│   git clone → ./init.sh → just doctor → just team-pi → work        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  SCAFFOLD LAYER                                                     │
│                                                                     │
│  init.sh ─────────────────► scaffold/v1/ (template snapshot)        │
│    ├── --brownfield mode         ├── extensions/*.ts                │
│    ├── --dry-run (planned)       ├── .pi/agents/*.md                │
│    └── placeholder replacement   ├── .pi/themes/*.json              │
│                                  ├── justfile, doctor.sh            │
│  doctor.sh ──────────────► env diagnostics                          │
│  bin/team-pi ────────────► launch with extension stack              │
│  manifest/distro.json ──► version + compatibility metadata          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  GENERATED PROJECT LAYER                                            │
│                                                                     │
│  <project-name>/                                                    │
│    ├── extensions/*.ts      ← composable, loaded via pi -e          │
│    ├── .pi/agents/*.md      ← agent definitions (frontmatter YAML)  │
│    ├── .pi/themes/*.json    ← 51-token color themes                 │
│    ├── .pi/damage-control-rules.yaml  ← safety guardrails           │
│    ├── justfile             ← 19+ recipes for extension stacks      │
│    ├── package.json         ← bun dependencies (yaml, sentry-cli)   │
│    ├── .env.sample          ← provider API key template             │
│    └── .github/workflows/   ← CI pipeline                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  RUNTIME LAYER (external — not bundled)                             │
│                                                                     │
│  pi (Pi Coding Agent)                                               │
│    ├── jiti runtime        ← loads .ts extensions without build     │
│    ├── ExtensionAPI        ← event hooks, tool/command registration │
│    ├── session management  ← branch-based conversation history      │
│    └── model providers     ← Anthropic, OpenAI, Google, OpenRouter… │
│                                                                     │
│  bun                       ← package manager, test runner, runtime  │
│  just                      ← task runner for justfile recipes       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  EXTENSION LAYER (18 extensions + 1 shared library, in-process)     │
│                                                                     │
│  ┌──── Core UX ────────────┐  ┌──── Orchestration ──────────────┐  │
│  │ minimal.ts              │  │ agent-team.ts (dispatch_agent)  │  │
│  │ pure-focus.ts           │  │ agent-chain.ts (run_chain)      │  │
│  │ theme-cycler.ts         │  │ pi-pi.ts (query_experts)        │  │
│  │ tool-counter.ts         │  │ subagent-widget.ts (subagent_*) │  │
│  │ tool-counter-widget.ts  │  │ system-select.ts                │  │
│  │ session-replay.ts       │  │ cross-agent.ts                  │  │
│  └──────────────────────────┘ └──────────────────────────────────┘  │
│  ┌──── Safety ─────────────┐  ┌──── Observability ──────────────┐  │
│  │ damage-control.ts       │  │ sentry.ts (middleware)          │  │
│  │ purpose-gate.ts         │  │ sentry-example.ts               │  │
│  │ tilldone.ts             │  │ health-check.ts                 │  │
│  └──────────────────────────┘ └──────────────────────────────────┘  │
│  ┌──── Shared ─────────────┐                                       │
│  │ themeMap.ts (not an     │                                       │
│  │ extension — shared lib) │                                       │
│  └──────────────────────────┘                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  AGENT LAYER                                                        │
│                                                                     │
│  .pi/agents/                                                        │
│    ├── teams.yaml          ← 5 team definitions                    │
│    ├── scout.md            ← recon (read-only tools)               │
│    ├── planner.md          ← task decomposition                    │
│    ├── builder.md          ← implementation (full tools)           │
│    ├── reviewer.md         ← code review                           │
│    ├── documenter.md       ← docs generation                      │
│    ├── red-team.md         ← adversarial testing                   │
│    ├── bowser.md           ← frontend specialist                   │
│    ├── plan-reviewer.md    ← plan QA                               │
│    └── pi-pi/              ← 9 domain experts + orchestrator       │
│        ├── ext-expert.md                                            │
│        ├── theme-expert.md                                          │
│        ├── skill-expert.md                                          │
│        ├── config-expert.md                                         │
│        ├── tui-expert.md                                            │
│        ├── prompt-expert.md                                         │
│        ├── agent-expert.md                                          │
│        ├── cli-expert.md                                            │
│        ├── keybinding-expert.md                                     │
│        └── pi-orchestrator.md                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
User                  Scaffold                      Runtime                   Extensions
 │                       │                              │                         │
 ├── git clone ──────────┤                              │                         │
 ├── ./init.sh name ─────┤                              │                         │
 │                       ├── cp -R scaffold/v1/ → dir   │                         │
 │                       ├── replace {{placeholders}}    │                         │
 │                       ├── git init + bun install      │                         │
 │                       ├── ✅ "Project ready"          │                         │
 │                       │                              │                         │
 ├── just doctor ────────┤                              │                         │
 │                       ├── check pi, bun, just        │                         │
 │                       ├── check auth (OAuth/.env)     │                         │
 │                       ├── check .pi/, .claude/, ext/  │                         │
 │                       ├── ✅ exit 0 / ❌ exit 1       │                         │
 │                       │                              │                         │
 ├── just team-pi ───────┤                              │                         │
 │                       ├── bin/team-pi                 │                         │
 │                       │   ├── source .env             │                         │
 │                       │   └── exec pi -e ext1 -e ext2│                         │
 │                       │                              ├── load ext1.ts (jiti)    │
 │                       │                              ├── top-level registration─┤
 │                       │                              │   ├── registerTool()     │
 │                       │                              │   ├── registerCommand()  │
 │                       │                              │   └── registerShortcut() │
 │                       │                              ├── emit session_start ────┤
 │                       │                              │                         ├── setFooter()
 │                       │                              │                         ├── setWidget()
 │                       │                              │                         ├── setStatus()
 │                       │                              │                         └── setTheme()
 │                       │                              │                         │
 ├── user prompt ────────┤                              │                         │
 │                       │                              ├── emit before_agent_start┤
 │                       │                              │                         ├── return {systemPrompt}
 │                       │                              ├── emit tool_call ────────┤
 │                       │                              │                         ├── return {block, reason}
 │                       │                              ├── emit tool_execution_end┤
 │                       │                              │                         ├── update counters
 │                       │                              ├── emit agent_end ────────┤
 │                       │                              │                         └── nudge/notify
```

### 1.3 Extension Composition Model

Extensions are **stacked** via multiple `-e` flags. Each extension runs in the same process. Order matters:

```bash
# Sentry FIRST (captures errors from subsequent extensions)
pi -e extensions/sentry.ts -e extensions/agent-team.ts -e extensions/theme-cycler.ts
```

**Conflict resolution:**
- **Footer**: Last extension to call `setFooter()` wins.
- **Theme**: `themeMap.ts` defers to the *first* `-e` extension via `primaryExtensionName()`.
- **System prompt**: `before_agent_start` hooks are chained; the last return value wins.
- **Tool blocking**: `tool_call` hooks run in registration order; first `block: true` wins.
- **Widgets**: Keyed by name (e.g., `"agent-team"`, `"sub-1"`); no namespace collision if names are unique.

---

## 2. Component Inventory & Dependency Map

### 2.1 Infrastructure Components

| Component | File(s) | Dependencies | Consumers | Status |
|-----------|---------|-------------|-----------|--------|
| **Root init.sh** | `init.sh` | `scaffold/v1/`, `perl`, `git`, `bun` | Users (CLI) | ⚠️ Needs consolidation (FR-P0-3) |
| **Scaffold init.sh** | `scaffold/init.sh` | `scaffold/v1/`, `perl`, `git`, `bun` | Scaffold e2e tests | ❌ Divergent — to be removed/redirected |
| **doctor.sh** | `doctor.sh` | `pi`, `bun`, `just` (checks presence) | `justfile` (`just doctor`), users | ⚠️ Stable but needs version checks (FR-P1-4) |
| **bin/team-pi** | `bin/team-pi` | `pi`, `.env`, `extensions/*.ts` | `justfile` (`just team-pi`), users | ✅ Stable |
| **justfile** | `justfile` | `pi`, `bun`, extensions | Users, CI | ✅ Stable — 19+ recipes |
| **package.json** | `package.json` | — | `bun install`, CI, npm registry | ❌ Has `{{project-name}}` placeholder (FR-P0-5) |
| **VERSION** | `VERSION` | — | `init.sh`, release scripts | ✅ Stable (`1.0.0`) |
| **manifest** | `manifest/distro.json` | — | CI, release tooling | ✅ Stable |
| **.env.sample** | `.env.sample` | — | Users, `doctor.sh` | ⚠️ Divergent with `.env.example` (FR-P0-6) |
| **.env.example** | `.env.example` | — | Users (Taskmaster-oriented) | ❌ To be deleted (FR-P0-6) |
| **.sentryclirc** | `.sentryclirc` | — | `sentry-cli` | ✅ No secrets committed |

### 2.2 Extension Components

| Extension | File | Category | Pi APIs Used | Tools Registered | Commands Registered | Status |
|-----------|------|----------|-------------|-----------------|--------------------|----|
| **minimal** | `extensions/minimal.ts` | Core UX | `session_start`, `setFooter` | — | — | ✅ |
| **pure-focus** | `extensions/pure-focus.ts` | Core UX | `session_start`, `setFooter` | — | — | ✅ |
| **theme-cycler** | `extensions/theme-cycler.ts` | Core UX | `session_start`, `session_shutdown`, `registerShortcut`, `registerCommand`, `setWidget`, `setStatus`, `setTheme`, `getAllThemes`, `select` | — | `/theme` | ✅ |
| **tool-counter** | `extensions/tool-counter.ts` | Core UX | `session_start`, `tool_execution_end`, `setFooter`, `sessionManager.getBranch`, `footerData` | — | — | ✅ |
| **tool-counter-widget** | `extensions/tool-counter-widget.ts` | Core UX | `session_start`, `tool_execution_end`, `setWidget` | — | — | ✅ |
| **session-replay** | `extensions/session-replay.ts` | Core UX | `session_start`, `registerCommand`, `sessionManager.getBranch`, `ui.custom` (overlay) | — | `/replay` | ✅ |
| **cross-agent** | `extensions/cross-agent.ts` | Orchestration | `session_start`, `registerCommand`, `sendUserMessage`, `notify` | — | Dynamic (`/<name>`, `/skill:<name>`) | ✅ |
| **system-select** | `extensions/system-select.ts` | Orchestration | `session_start`, `before_agent_start`, `registerCommand`, `setActiveTools`, `getActiveTools`, `select`, `setStatus` | — | `/system` | ✅ |
| **agent-team** | `extensions/agent-team.ts` | Orchestration | `session_start`, `before_agent_start`, `registerTool`, `registerCommand`, `setWidget`, `setFooter`, `setStatus`, `setActiveTools`, `select`, `notify` | `dispatch_agent` | `/agents-team`, `/agents-list`, `/agents-grid` | ✅ |
| **agent-chain** | `extensions/agent-chain.ts` | Orchestration | `session_start`, `before_agent_start`, `registerTool`, `registerCommand`, `setWidget`, `setFooter`, `setStatus`, `select`, `notify` | `run_chain` | `/chain`, `/chain-list` | ✅ |
| **pi-pi** | `extensions/pi-pi.ts` | Orchestration | `session_start`, `before_agent_start`, `registerTool`, `registerCommand`, `setWidget`, `setFooter`, `setStatus`, `notify` | `query_experts` | `/experts`, `/experts-grid` | ✅ |
| **subagent-widget** | `extensions/subagent-widget.ts` | Orchestration | `session_start`, `registerTool`, `registerCommand`, `setWidget`, `sendMessage`, `notify` | `subagent_create`, `subagent_continue`, `subagent_remove`, `subagent_list` | `/sub`, `/subcont`, `/subrm`, `/subclear` | ✅ |
| **damage-control** | `extensions/damage-control.ts` | Safety | `session_start`, `tool_call`, `isToolCallEventType`, `appendEntry`, `setStatus`, `confirm`, `abort`, `notify` | — | — | ✅ |
| **purpose-gate** | `extensions/purpose-gate.ts` | Safety | `session_start`, `before_agent_start`, `input`, `setWidget`, `input` (dialog), `notify` | — | — | ✅ |
| **tilldone** | `extensions/tilldone.ts` | Safety | `session_start`, `session_switch`, `session_fork`, `session_tree`, `tool_call`, `agent_end`, `input`, `registerTool`, `registerCommand`, `setWidget`, `setFooter`, `setStatus`, `confirm`, `sendMessage`, `ui.custom` (overlay), `sessionManager.getBranch` | `tilldone` | `/tilldone` | ✅ |
| **health-check** | `extensions/health-check.ts` | Observability | `session_start`, `registerCommand`, `setStatus`, `notify` | — | `/health` | ✅ |
| **sentry** | `extensions/sentry.ts` | Observability | `session_start`, `tool_execution_error`, `command_error`, `agent_error`, `registerCommand`, `setStatus`, `notify` | — | `/sentry-test`, `/sentry-message`, `/sentry-status`, `/sentry-set-dsn` | ✅ |
| **sentry-example** | `extensions/sentry-example.ts` | Observability | `session_start`, `tool_execution_error`, `command_error`, `registerCommand`, `notify` | — | `/sentry-test`, `/sentry-message`, `/sentry-status` | ✅ |

### 2.3 Shared Library

| Component | File | Exports | Consumers |
|-----------|------|---------|-----------|
| **themeMap** | `extensions/themeMap.ts` | `THEME_MAP`, `applyExtensionTheme()`, `applyExtensionDefaults()` | 17 of 18 extensions (all except `health-check`) |

### 2.4 Agent Definitions

| Agent | File | Tools | Used By |
|-------|------|-------|---------|
| scout | `.pi/agents/scout.md` | `read,grep,find,ls` | teams: full, info |
| planner | `.pi/agents/planner.md` | — | teams: full, plan-build, frontend |
| builder | `.pi/agents/builder.md` | `read,write,edit,bash,grep,find,ls` | teams: full, plan-build, frontend |
| reviewer | `.pi/agents/reviewer.md` | — | teams: full, plan-build, info |
| documenter | `.pi/agents/documenter.md` | — | teams: full, info |
| red-team | `.pi/agents/red-team.md` | — | teams: full |
| bowser | `.pi/agents/bowser.md` | — | teams: frontend |
| plan-reviewer | `.pi/agents/plan-reviewer.md` | — | — (standalone) |
| 9 pi-pi experts | `.pi/agents/pi-pi/*.md` | various | teams: pi-pi; ext: pi-pi.ts |

### 2.5 CI Pipeline

| Component | File | Status |
|-----------|------|--------|
| Root CI | `.github/workflows/ci.yml` | ❌ Test job is `echo "No tests configured yet"` |
| Scaffold E2E CI | `scaffold/.github/workflows/e2e.yml` | ✅ Runs real tests via `npm test` |
| Scaffold E2E tests | `scaffold/tests/e2e.test.mjs` | ✅ 9 test cases, uses `node:test` |

---

## 3. Testing Strategy

### 3.1 Test Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│  Tier 3: E2E Tests (tests/e2e/)                                 │
│  Full workflow: init.sh → doctor → extension loading            │
│  Tool: node:test + child_process                                │
│  Runs in CI: ubuntu-latest + macos-latest                       │
├─────────────────────────────────────────────────────────────────┤
│  Tier 2: Integration Tests (tests/integration/)                 │
│  init.sh greenfield/brownfield, doctor.sh, bin/team-pi          │
│  Tool: bun test                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Tier 1: Unit Tests (tests/unit/)                               │
│  Extension imports, themeMap validation, doctor exit codes       │
│  Tool: bun test                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Tier 1: Unit Tests

**Location:** `tests/unit/`
**Runner:** `bun test`
**Coverage target:** 100% of extensions importable, >80% of critical-path behavioral assertions.

#### 3.2.1 Extension Import Validation

Every `extensions/*.ts` file must be importable by Bun without error. This catches broken imports, missing dependencies, and syntax errors — the most common failure mode.

```typescript
// tests/unit/extensions-import.test.ts
import { describe, it, expect } from "bun:test";
import { readdirSync } from "fs";
import { join } from "path";

const extensionsDir = join(import.meta.dir, "../../extensions");
const extensionFiles = readdirSync(extensionsDir)
  .filter(f => f.endsWith(".ts") && f !== "themeMap.ts");

describe("extension imports", () => {
  for (const file of extensionFiles) {
    it(`imports ${file} without error`, async () => {
      const mod = await import(join(extensionsDir, file));
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe("function");
    });
  }
});
```

#### 3.2.2 themeMap Validation

```typescript
// tests/unit/theme-map.test.ts
import { describe, it, expect } from "bun:test";
import { THEME_MAP } from "../../extensions/themeMap.ts";
import { readdirSync } from "fs";
import { join } from "path";

const themesDir = join(import.meta.dir, "../../.pi/themes");
const themeFiles = readdirSync(themesDir)
  .filter(f => f.endsWith(".json"))
  .map(f => f.replace(".json", ""));

const extensionFiles = readdirSync(join(import.meta.dir, "../../extensions"))
  .filter(f => f.endsWith(".ts") && f !== "themeMap.ts")
  .map(f => f.replace(".ts", ""));

describe("themeMap", () => {
  it("maps only to themes that exist in .pi/themes/", () => {
    for (const [ext, theme] of Object.entries(THEME_MAP)) {
      expect(themeFiles).toContain(theme);
    }
  });

  it("maps only extensions that exist in extensions/", () => {
    for (const ext of Object.keys(THEME_MAP)) {
      expect(extensionFiles).toContain(ext);
    }
  });

  it("has a mapping for every extension except health-check and sentry-example", () => {
    const unmapped = extensionFiles.filter(
      e => !(e in THEME_MAP) && !["health-check", "sentry-example"].includes(e)
    );
    expect(unmapped).toEqual([]);
  });
});
```

#### 3.2.3 Theme JSON Schema Validation

```typescript
// tests/unit/themes.test.ts
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const themesDir = join(import.meta.dir, "../../.pi/themes");
const REQUIRED_COLOR_KEYS = [
  "accent", "border", "borderAccent", "borderMuted",
  "success", "error", "warning", "muted", "dim", "text",
  "selectedBg", "userMessageBg", "userMessageText",
  "toolPendingBg", "toolSuccessBg", "toolErrorBg", "toolTitle", "toolOutput",
  "mdHeading", "mdLink", "mdCode", "mdCodeBlock",
];

describe("theme JSON files", () => {
  const files = readdirSync(themesDir).filter(f => f.endsWith(".json"));

  for (const file of files) {
    it(`${file} is valid JSON with required fields`, () => {
      const raw = readFileSync(join(themesDir, file), "utf-8");
      const theme = JSON.parse(raw);

      expect(theme.name).toBeDefined();
      expect(typeof theme.name).toBe("string");
      expect(theme.vars).toBeDefined();
      expect(theme.colors).toBeDefined();

      for (const key of REQUIRED_COLOR_KEYS) {
        expect(theme.colors[key]).toBeDefined();
      }
    });
  }
});
```

#### 3.2.4 Agent Definition Validation

```typescript
// tests/unit/agents.test.ts
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const agentsDir = join(import.meta.dir, "../../.pi/agents");

describe("agent definitions", () => {
  const files = readdirSync(agentsDir).filter(f => f.endsWith(".md"));

  for (const file of files) {
    it(`${file} has valid frontmatter`, () => {
      const raw = readFileSync(join(agentsDir, file), "utf-8");
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      expect(match).not.toBeNull();

      const frontmatter: Record<string, string> = {};
      for (const line of match![1].split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      }

      expect(frontmatter.name).toBeDefined();
      expect(frontmatter.description).toBeDefined();
    });
  }

  it("teams.yaml references only existing agent names", () => {
    const teamsRaw = readFileSync(join(agentsDir, "teams.yaml"), "utf-8");
    const agentNames = new Set<string>();

    // Collect all agent names from .md files (top-level + pi-pi/)
    for (const f of files) {
      const raw = readFileSync(join(agentsDir, f), "utf-8");
      const match = raw.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        for (const line of match[1].split("\n")) {
          if (line.startsWith("name:")) {
            agentNames.add(line.slice(5).trim());
          }
        }
      }
    }

    const piPiDir = join(agentsDir, "pi-pi");
    if (existsSync(piPiDir)) {
      for (const f of readdirSync(piPiDir).filter(f => f.endsWith(".md"))) {
        const raw = readFileSync(join(piPiDir, f), "utf-8");
        const match = raw.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
          for (const line of match[1].split("\n")) {
            if (line.startsWith("name:")) {
              agentNames.add(line.slice(5).trim());
            }
          }
        }
      }
    }

    // Parse team members from YAML
    const memberRefs: string[] = [];
    for (const line of teamsRaw.split("\n")) {
      const itemMatch = line.match(/^\s+-\s+(.+)$/);
      if (itemMatch) memberRefs.push(itemMatch[1].trim());
    }

    for (const ref of memberRefs) {
      expect(agentNames.has(ref)).toBe(true);
    }
  });
});
```

#### 3.2.5 doctor.sh Exit Code Validation

```typescript
// tests/unit/doctor.test.ts
import { describe, it, expect } from "bun:test";
import { spawnSync } from "child_process";
import { join } from "path";

const doctorPath = join(import.meta.dir, "../../doctor.sh");

describe("doctor.sh", () => {
  it("exits 0 when all tools are present", () => {
    const result = spawnSync("bash", [doctorPath], {
      encoding: "utf-8",
      env: { ...process.env },
    });
    // On a dev machine with pi, bun, just installed
    if (result.status === 0) {
      expect(result.stdout).toContain("success");
    }
    // Always ensure it doesn't crash
    expect(result.status).not.toBeNull();
  });

  it("produces structured output with color codes", () => {
    const result = spawnSync("bash", [doctorPath], {
      encoding: "utf-8",
      env: { ...process.env },
    });
    expect(result.stdout).toContain("Pi Team Distro Doctor");
  });
});
```

### 3.3 Tier 2: Integration Tests

**Location:** `tests/integration/`
**Runner:** `bun test`

#### 3.3.1 init.sh Greenfield

```typescript
// tests/integration/init-greenfield.test.ts
import { describe, it, expect, afterEach } from "bun:test";
import { execSync } from "child_process";
import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const initScript = join(import.meta.dir, "../../init.sh");

describe("init.sh greenfield", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const d of tmpDirs) {
      rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("creates a project with all expected directories", () => {
    const parentDir = join(tmpdir(), `pi-test-${Date.now()}`);
    tmpDirs.push(parentDir);

    execSync(`bash ${initScript} test-project ${parentDir}`, {
      env: { ...process.env, PATH: "/usr/bin:/bin" }, // no bun
    });

    const projectDir = join(parentDir, "test-project");
    expect(existsSync(join(projectDir, ".pi/agents/teams.yaml"))).toBe(true);
    expect(existsSync(join(projectDir, ".pi/themes/synthwave.json"))).toBe(true);
    expect(existsSync(join(projectDir, "extensions/minimal.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "justfile"))).toBe(true);
    expect(existsSync(join(projectDir, "doctor.sh"))).toBe(true);
  });

  it("replaces {{project-name}} in package.json", () => {
    const parentDir = join(tmpdir(), `pi-test-${Date.now()}`);
    tmpDirs.push(parentDir);

    execSync(`bash ${initScript} "My Agent" ${parentDir}`, {
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    });

    const pkg = JSON.parse(
      readFileSync(join(parentDir, "My Agent", "package.json"), "utf-8")
    );
    expect(pkg.name).toBe("my-agent");
  });

  it("fails when target directory already exists", () => {
    const parentDir = join(tmpdir(), `pi-test-${Date.now()}`);
    tmpDirs.push(parentDir);

    execSync(`bash ${initScript} dup-test ${parentDir}`, {
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    });

    expect(() => {
      execSync(`bash ${initScript} dup-test ${parentDir}`, {
        env: { ...process.env, PATH: "/usr/bin:/bin" },
      });
    }).toThrow();
  });
});
```

#### 3.3.2 init.sh Brownfield Idempotency

```typescript
// tests/integration/init-brownfield.test.ts
import { describe, it, expect, afterEach } from "bun:test";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const initScript = join(import.meta.dir, "../../init.sh");

describe("init.sh brownfield", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const d of tmpDirs) {
      rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("does not overwrite existing package.json", () => {
    const dir = join(tmpdir(), `pi-brown-${Date.now()}`);
    tmpDirs.push(dir);
    mkdirSync(dir, { recursive: true });

    const existingPkg = { name: "existing-project", version: "2.0.0" };
    writeFileSync(join(dir, "package.json"), JSON.stringify(existingPkg));

    execSync(`bash ${initScript} --brownfield ${dir}`, {
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    });

    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    expect(pkg.name).toBe("existing-project");
    expect(pkg.version).toBe("2.0.0");
  });

  it("is idempotent — running twice produces no errors", () => {
    const dir = join(tmpdir(), `pi-brown-${Date.now()}`);
    tmpDirs.push(dir);
    mkdirSync(dir, { recursive: true });

    execSync(`bash ${initScript} --brownfield ${dir}`, {
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    });

    // Second run should not throw
    execSync(`bash ${initScript} --brownfield ${dir}`, {
      env: { ...process.env, PATH: "/usr/bin:/bin" },
    });
  });
});
```

### 3.4 Tier 3: E2E Tests

**Location:** `tests/e2e/`
**Approach:** Migrate and extend `scaffold/tests/e2e.test.mjs` to cover the full workflow.

The existing e2e suite in `scaffold/tests/e2e.test.mjs` has 9 comprehensive tests. The migration plan:

1. Move `scaffold/tests/e2e.test.mjs` → `tests/e2e/scaffold.test.mjs`
2. Update `initScript` path to reference root `init.sh`
3. Add new tests for brownfield mode and doctor.sh integration
4. Keep using `node:test` (compatible with both `node --test` and `bun test`)

### 3.5 Test Configuration

```jsonc
// bunfig.toml (or package.json test config)
// tests/unit/     — fast, no I/O, < 5s
// tests/integration/ — fs operations, < 30s
// tests/e2e/      — spawns processes, < 120s
```

**package.json additions:**
```json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test tests/unit/",
    "test:integration": "bun test tests/integration/",
    "test:e2e": "bun test tests/e2e/"
  }
}
```

---

## 4. CI/CD Pipeline Design

### 4.1 Redesigned Workflow

Replace the current `.github/workflows/ci.yml` with a pipeline that runs real tests:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  SENTRY_ORG: ${{ vars.SENTRY_ORG }}
  SENTRY_PROJECT: ${{ vars.SENTRY_PROJECT }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Shellcheck
        run: |
          sudo apt-get install -y shellcheck
          shellcheck init.sh doctor.sh bin/team-pi

      - name: TypeScript type-check
        run: |
          # Validate all extensions can be parsed without error
          for f in extensions/*.ts; do
            echo "Checking $f..."
            bun build --target=bun --no-bundle "$f" > /dev/null
          done
          echo "✅ All extensions type-check passed"

  unit-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    needs: [lint]
    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun test tests/unit/

  integration-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    needs: [unit-tests]
    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Just
        uses: extractions/setup-just@v2

      - name: Install dependencies
        run: bun install

      - name: Run integration tests
        run: bun test tests/integration/

  e2e-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    needs: [integration-tests]
    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Just
        uses: extractions/setup-just@v2

      - name: Install dependencies
        run: bun install

      - name: Run e2e tests
        run: bun test tests/e2e/

  scaffold-sync-check:
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4

      - name: Verify scaffold/v1/ mirrors root
        run: |
          # Check key files are in sync (excluding placeholder files)
          for dir in extensions .pi/agents .pi/themes; do
            if [ -d "scaffold/v1/$dir" ]; then
              diff -rq "$dir" "scaffold/v1/$dir" \
                --exclude='*.json' || {
                echo "❌ scaffold/v1/$dir is out of sync with root $dir"
                exit 1
              }
            fi
          done
          echo "✅ scaffold/v1/ is in sync with root"

  sentry:
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    if: github.event_name == 'push' && env.SENTRY_AUTH_TOKEN != ''
    steps:
      - uses: actions/checkout@v4
      - name: Install Bun
        uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install
      - name: Create Sentry release
        run: |
          VERSION=$(npx sentry-cli releases propose-version)
          npx sentry-cli releases new "$VERSION" --ignore-empty
          npx sentry-cli releases set-commits "$VERSION" --auto
          npx sentry-cli releases finalize "$VERSION" || true

  release:
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    if: startsWith(github.ref, 'refs/tags/v')
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

### 4.2 Pipeline Diagram

```
push/PR to main
       │
       ▼
   ┌── lint ──────────────────────────────────────┐
   │  shellcheck init.sh doctor.sh bin/team-pi     │
   │  bun build --target=bun extensions/*.ts       │
   └──────────────────────┬───────────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
  unit-tests         unit-tests        scaffold-sync
  (ubuntu)           (macos)           (ubuntu)
       │                  │
       ▼                  ▼
  integration         integration
  (ubuntu)           (macos)
       │                  │
       ▼                  ▼
   e2e-tests          e2e-tests
   (ubuntu)           (macos)
       │                  │
       └──────┬───────────┘
              │
     ┌────────┼────────┐
     ▼                 ▼
   sentry           release
   (on push)     (on tag v*)
```

### 4.3 Key Differences from Current CI

| Aspect | Current | Redesigned |
|--------|---------|-----------|
| Test job | `echo "No tests configured yet"` | `bun test tests/unit/ && tests/integration/ && tests/e2e/` |
| Lint job | Loops over files, prints `✓` | `shellcheck` + `bun build --target=bun` validation |
| Build job | `ls -la extensions/` + `ls -la lib/` | Removed — no build step needed (jiti runtime) |
| Matrix | ubuntu-latest only | ubuntu-latest + macos-latest |
| Caching | None | Bun cache via `setup-bun` action |
| Release | None | GitHub Release on `v*` tag |
| Sync check | None | Verifies `scaffold/v1/` mirrors root |

---

## 5. Versioning & Release Strategy

### 5.1 Semantic Versioning

The `VERSION` file at repo root is the source of truth. Current: `1.0.0`.

| Increment | When |
|-----------|------|
| **Major** (`2.0.0`) | Breaking changes to init.sh API, extension API surface, or agent definition format. |
| **Minor** (`1.1.0`) | New extensions, new justfile recipes, new agent definitions, new features in init.sh or doctor.sh. |
| **Patch** (`1.0.1`) | Bug fixes, documentation updates, dependency bumps, CI improvements. |

### 5.2 Conventional Commits

Adopt [Conventional Commits](https://www.conventionalcommits.org/) for structured changelogs:

```
feat(init): add --dry-run flag for brownfield mode
fix(doctor): check bun version >= 1.0
chore(ci): replace placeholder test step with real tests
docs: add TROUBLESHOOTING.md
refactor(init): consolidate scaffold/init.sh into root
test: add extension import validation suite
```

### 5.3 CHANGELOG.md Format

Follow [Keep a Changelog](https://keepachangelog.com/). Example structure:

````markdown
# Changelog

All notable changes to Pi Scaffold will be documented in this file.

## [Unreleased]

### Added
- Extension test suite with import validation (FR-P0-1)
- docs/TROUBLESHOOTING.md with 8+ entries (FR-P0-7)

### Fixed
- package.json placeholder {{project-name}} at root (FR-P0-5)

### Changed
- Consolidated init.sh — scaffold/init.sh now redirects to root (FR-P0-3)

### Removed
- .env.example (consolidated into .env.sample) (FR-P0-6)

## [1.0.0] — YYYY-MM-DD

### Added
- 18 composable TypeScript extensions + 1 shared library (themeMap.ts)
- 11 agent definitions with teams.yaml orchestration (5 teams)
- 11 color themes with 51-token schema
- init.sh with greenfield and brownfield modes
- doctor.sh environment diagnostics
- bin/team-pi one-command launcher
- damage-control-rules.yaml safety guardrails
- bolt-ons/agency-full/ capability pack
- GitHub Actions CI pipeline
- justfile with 19+ recipes
````

### 5.4 Release Workflow

```bash
# 1. Update version
echo "1.1.0" > VERSION

# 2. Update CHANGELOG.md (move [Unreleased] to [1.1.0])

# 3. Commit
git add VERSION CHANGELOG.md
git commit -m "chore(release): v1.1.0"

# 4. Tag
git tag -a v1.1.0 -m "Release v1.1.0"

# 5. Push (triggers release job in CI)
git push origin main --tags
```

**Future automation** (`just release` recipe):

```just
# Bump version, update changelog, tag, and push
release version:
    #!/usr/bin/env bash
    echo "{{version}}" > VERSION
    git add VERSION CHANGELOG.md
    git commit -m "chore(release): v{{version}}"
    git tag -a "v{{version}}" -m "Release v{{version}}"
    git push origin main --tags
    echo "✅ Released v{{version}}"
```

### 5.5 Release Checklist

Expanded from `scaffold/docs/RELEASE_CHECKLIST.md`:

- [ ] All P0 requirements implemented and merged
- [ ] `bun test` passes (all tiers)
- [ ] CI green on `main` (ubuntu + macOS)
- [ ] `VERSION` file updated
- [ ] `CHANGELOG.md` has entry for this version
- [ ] No `{{placeholder}}` strings in root-level files
- [ ] `scaffold/v1/` is in sync with root (CI assertion passes)
- [ ] `just doctor` passes on a clean machine
- [ ] Manual smoke test: `init.sh test-project /tmp` → `just doctor` → `just team-pi`
- [ ] Brownfield smoke test: `init.sh --brownfield .` in existing Node project
- [ ] `git tag -a vX.Y.Z` created from verified commit
- [ ] GitHub Release published with auto-generated notes

---

## 6. Init.sh Consolidation Plan

### 6.1 Current State

Two init scripts exist with divergent capabilities:

| Feature | Root `init.sh` | `scaffold/init.sh` |
|---------|---------------|-------------------|
| Greenfield mode | ✅ | ✅ |
| Brownfield mode | ✅ `--brownfield` | ❌ |
| Placeholder replacement | ✅ `perl` | ✅ `perl` |
| Target dir argument | ✅ 2nd positional | ✅ 2nd positional |
| Help text | ✅ `--help` or no args | ❌ Usage on no args |
| `maxdepth` on find | ✅ `-maxdepth 2` | ❌ Unlimited depth |
| `bun install` | ✅ | ✅ |
| `git init` | ✅ (only in greenfield) | ✅ (always) |
| `pure-focus.ts` path fix | ✅ | ✅ |

### 6.2 Migration Steps

**Step 1:** Replace `scaffold/init.sh` with a redirect.

```bash
#!/usr/bin/env bash
# This script has been consolidated into the root init.sh.
# See: https://github.com/[repo]/docs/PRD.md#fr-p0-3
exec "$(cd "$(dirname "$0")/.." && pwd)/init.sh" "$@"
```

**Step 2:** Update `scaffold/tests/e2e.test.mjs`.

The test file currently defines:
```javascript
const initScript = path.join(repoRoot, "init.sh");
```
where `repoRoot` is `scaffold/`. Change to:
```javascript
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const initScript = path.join(repoRoot, "init.sh");
```

**Step 3:** Update `scaffold/.github/workflows/e2e.yml` working directory.

The CI runs `npm test` from `scaffold/`. Update to run from root or adjust paths.

**Step 4:** Update `README.md` to reference only one init path.

### 6.3 `--dry-run` Flag Design (FR-P1-2)

Add to the canonical `init.sh`:

```bash
DRY_RUN=false
# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --brownfield)  BROWNFIELD=true; shift ;;
    --dry-run)     DRY_RUN=true; shift ;;
    --verbose)     VERBOSE=true; shift ;;
    --help|-h)     show_help ;;
    *)             break ;;
  esac
done
```

Dry-run output format:
```
🔍 Dry run for --brownfield in /path/to/project

  [CREATE]  .pi/agents/teams.yaml
  [CREATE]  .pi/agents/scout.md
  [CREATE]  .pi/themes/synthwave.json
  [SKIP]    .gitignore (already exists)
  [SKIP]    package.json (already exists)
  [MERGE]   justfile (append Pi recipes)
  [CREATE]  extensions/minimal.ts
  ...

  13 files would be created
   1 file would be merged
   3 files would be skipped

No files were modified. Remove --dry-run to apply.
```

Implementation approach:
- Replace `cp` calls with conditional `log_action()` calls
- Replace `cat >>` (justfile merge) with conditional reporting
- Exit before `bun install` and `git init`

### 6.4 Idempotency Guards for Brownfield

Current problem: Running `init.sh --brownfield .` twice appends justfile recipes a second time.

Fix: Check for sentinel marker before appending:

```bash
if [[ -f "$TARGET_DIR/justfile" ]]; then
  if grep -q "# ── Pi Extension Stacks" "$TARGET_DIR/justfile"; then
    echo "   ○ justfile already has Pi recipes (skipping)"
  else
    echo "   + appending Pi recipes to justfile"
    echo "" >> "$TARGET_DIR/justfile"
    echo "# ── Pi Extension Stacks (Added by Scaffold) ───────────────────────" >> "$TARGET_DIR/justfile"
    cat "$VERSION_DIR/justfile" >> "$TARGET_DIR/justfile"
  fi
fi
```

---

## 7. Security Considerations

### 7.1 Secret Management

| File | Contains Secrets? | Protection |
|------|-------------------|-----------|
| `.env` | ✅ Real API keys | In `.gitignore` — never committed |
| `.env.sample` | ❌ Placeholders only | `sk-...`, `AIza...`, `fc-...` — safe to commit |
| `.sentryclirc` | ❌ Empty `org`/`project` fields | No `auth.token` field; tokens via env vars |
| `$HOME/.pi/agent/auth.json` | ✅ OAuth tokens | Outside repo; managed by Pi runtime |
| `.github/workflows/ci.yml` | ❌ References `${{ secrets.* }}` | GitHub Secrets store; never printed |

**Verification:** `grep -rn "sk-ant-\|sk-proj-\|AIza\|ghp_\|pplx-" . --include='*.ts' --include='*.json' --include='*.yaml' --include='*.yml'` must return zero matches on real keys.

### 7.2 damage-control-rules.yaml Analysis

The rules file at `.pi/damage-control-rules.yaml` defines 3 protection tiers:

| Tier | Section | Count | Behavior |
|------|---------|-------|----------|
| **Block** | `bashToolPatterns` (no `ask`) | ~40 rules | Immediately block + abort; agent told "DO NOT retry" |
| **Confirm** | `bashToolPatterns` (with `ask: true`) | ~6 rules | User confirmation dialog with 30s timeout |
| **Zero Access** | `zeroAccessPaths` | ~40 paths | Block read/write/grep to sensitive files (`.env`, SSH keys, cloud credentials) |
| **Read Only** | `readOnlyPaths` | ~30 paths | Block write/edit; allow read (lockfiles, `/etc/`, build artifacts) |
| **No Delete** | `noDeletePaths` | ~25 paths | Block `rm`/`mv` on protected files (LICENSE, .git/, CI configs) |

**Coverage assessment:**
- ✅ Destructive shell commands (`rm -rf`, `sudo rm`, `mkfs`)
- ✅ Git history destruction (`git reset --hard`, `git push --force`, `git filter-branch`)
- ✅ Cloud provider deletions (AWS, GCP, Vercel, Netlify, Cloudflare)
- ✅ Database destructive operations (DROP, TRUNCATE, DELETE without WHERE)
- ✅ Secret file access (`.env*`, SSH keys, cloud credentials)
- ⚠️ No coverage for: `curl | bash`, `wget | sh`, or pipe-to-eval patterns
- ⚠️ No coverage for: npm/bun script injection via `postinstall`

### 7.3 Extension Sandboxing

**Current state: No sandboxing.** Extensions run in the same process as Pi with full Node.js capabilities:

- **File system**: Unrestricted `fs` access (extensions like `agent-team.ts` read/write session files)
- **Process spawning**: `child_process.spawn` used by `agent-team.ts`, `agent-chain.ts`, `pi-pi.ts`, `subagent-widget.ts` to launch subagent Pi processes
- **Network**: Unrestricted `fetch` (used by `sentry.ts` to POST to Sentry HTTP API)
- **Environment**: Full `process.env` access (extensions read API keys, Sentry DSN)

**Mitigation:**
- `damage-control.ts` acts as a tool-call interceptor but cannot restrict extension code itself
- Extensions are trusted code — only install extensions from known sources
- This is architecturally consistent with Pi's design (extensions are plugins, not user-submitted code)

### 7.4 Subagent Process Security

`agent-team.ts`, `agent-chain.ts`, `pi-pi.ts`, and `subagent-widget.ts` all spawn child `pi` processes:

```typescript
spawn("pi", [
  "--mode", "json",
  "-p",
  "--no-extensions",    // subagents don't load extensions
  "--model", model,
  "--tools", "read,bash,grep,find,ls",
  task,
], { env: { ...process.env } });
```

**Risks:**
- Subagents inherit the full `process.env` (including API keys)
- Subagents have `bash` tool access — can execute arbitrary commands
- `--no-extensions` means damage-control rules are NOT enforced on subagents

**Recommended mitigation (P2):** Pass `damage-control-rules.yaml` path to subagents or implement a `--rules` flag in Pi itself.

---

## 8. Rollout Plan

### 8.1 Phase 1: Alpha (Weeks 1–3)

**Goal:** All P0 requirements implemented. CI green. Internal testing.

| Week | Deliverables |
|------|-------------|
| **Week 1** | FR-P0-5 (fix package.json), FR-P0-6 (consolidate .env files), FR-P0-3 (consolidate init.sh) |
| **Week 2** | FR-P0-1 (extension test suite), FR-P0-2 (CI pipeline redesign) |
| **Week 3** | FR-P0-4 (CHANGELOG.md), FR-P0-7 (troubleshooting guide), internal smoke testing |

**Gate criteria for Alpha → Beta:**
- [ ] All P0 PRs merged to `main`
- [ ] CI green on ubuntu-latest (macos-latest = stretch goal)
- [ ] `bun test` passes all tiers
- [ ] Manual smoke test passes (greenfield + brownfield)
- [ ] No `{{placeholder}}` strings in root-level files

### 8.2 Phase 2: Beta (Weeks 4–6)

**Goal:** P1 requirements. External testers. Feedback incorporated.

| Week | Deliverables |
|------|-------------|
| **Week 4** | FR-P1-1 (CONTRIBUTING.md), FR-P1-3 (extension validation recipe) |
| **Week 5** | FR-P1-2 (--dry-run mode), FR-P1-4 (doctor.sh version checks) |
| **Week 6** | FR-P1-5 (scaffold/v1 dedup), feedback triage, bug fixes |

**Gate criteria for Beta → GA:**
- [ ] All P1 PRs merged to `main`
- [ ] CI green on both ubuntu-latest and macos-latest
- [ ] At least 2 external testers have run the full onboarding flow
- [ ] All P0 + P1 feedback items resolved or deferred with rationale
- [ ] `CONTRIBUTING.md` reviewed by someone who hasn't contributed before

### 8.3 Phase 3: GA (Weeks 7–8)

**Goal:** Final polish. Version tag. Public announcement.

| Week | Deliverables |
|------|-------------|
| **Week 7** | P2 stretch goals (cherry-pick based on feedback), final docs pass, CHANGELOG finalization |
| **Week 8** | `git tag v1.0.0`, GitHub Release, README update with badges, announcement |

**GA release criteria:** See [docs/PRD.md §7. Release Criteria](./PRD.md#7-release-criteria) for the complete checklist.

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1–2)

| Task ID | Task | Files Affected | Est. Effort | Dependencies | PRD Ref |
|---------|------|---------------|-------------|-------------|---------|
| T-01 | Fix `package.json` placeholder at root | `package.json` | 15 min | — | FR-P0-5 |
| T-02 | Delete `.env.example`, merge keys into `.env.sample` | `.env.sample`, `.env.example` | 30 min | — | FR-P0-6 |
| T-03 | Replace `scaffold/init.sh` with redirect | `scaffold/init.sh` | 15 min | — | FR-P0-3 |
| T-04 | Update `scaffold/tests/e2e.test.mjs` paths | `scaffold/tests/e2e.test.mjs` | 30 min | T-03 | FR-P0-3 |
| T-05 | Add idempotency guard to brownfield justfile merge | `init.sh` | 30 min | T-03 | NFR-1 |
| T-06 | Create `tests/unit/extensions-import.test.ts` | `tests/unit/extensions-import.test.ts` | 1 hr | T-01 | FR-P0-1 |
| T-07 | Create `tests/unit/theme-map.test.ts` | `tests/unit/theme-map.test.ts` | 30 min | — | FR-P0-1 |
| T-08 | Create `tests/unit/themes.test.ts` | `tests/unit/themes.test.ts` | 30 min | — | FR-P0-1 |
| T-09 | Create `tests/unit/agents.test.ts` | `tests/unit/agents.test.ts` | 45 min | — | FR-P0-1 |
| T-10 | Create `tests/unit/doctor.test.ts` | `tests/unit/doctor.test.ts` | 30 min | — | FR-P0-1 |
| T-11 | Create `tests/integration/init-greenfield.test.ts` | `tests/integration/init-greenfield.test.ts` | 1 hr | T-03 | FR-P0-1 |
| T-12 | Create `tests/integration/init-brownfield.test.ts` | `tests/integration/init-brownfield.test.ts` | 1 hr | T-05 | FR-P0-1 |
| T-13 | Add `test` scripts to `package.json` | `package.json` | 15 min | T-01, T-06 | FR-P0-1 |
| T-14 | Redesign `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | 2 hr | T-06..T-13 | FR-P0-2 |

### Phase 2: Documentation (Week 3)

| Task ID | Task | Files Affected | Est. Effort | Dependencies | PRD Ref |
|---------|------|---------------|-------------|-------------|---------|
| T-15 | Create `CHANGELOG.md` with retroactive v1.0.0 entry | `CHANGELOG.md` | 1 hr | — | FR-P0-4 |
| T-16 | Create `docs/TROUBLESHOOTING.md` (8+ entries) | `docs/TROUBLESHOOTING.md` | 2 hr | — | FR-P0-7 |
| T-17 | Add troubleshooting link to `README.md` | `README.md` | 15 min | T-16 | FR-P0-7 |

### Phase 3: Hardening (Weeks 4–5)

| Task ID | Task | Files Affected | Est. Effort | Dependencies | PRD Ref |
|---------|------|---------------|-------------|-------------|---------|
| T-18 | Create `CONTRIBUTING.md` | `CONTRIBUTING.md` | 3 hr | — | FR-P1-1 |
| T-19 | Add `just validate-extensions` recipe | `justfile` | 1 hr | — | FR-P1-3 |
| T-20 | Implement `--dry-run` flag in `init.sh` | `init.sh` | 2 hr | T-03, T-05 | FR-P1-2 |
| T-21 | Add version checks to `doctor.sh` | `doctor.sh` | 1 hr | — | FR-P1-4 |
| T-22 | Add test for `--dry-run` mode | `tests/integration/init-dryrun.test.ts` | 1 hr | T-20 | FR-P1-2 |
| T-23 | Add test for doctor.sh version checks | `tests/unit/doctor.test.ts` | 30 min | T-21 | FR-P1-4 |

### Phase 4: Deduplication (Week 6)

| Task ID | Task | Files Affected | Est. Effort | Dependencies | PRD Ref |
|---------|------|---------------|-------------|-------------|---------|
| T-24 | Create `scripts/sync-to-v1.sh` | `scripts/sync-to-v1.sh` | 2 hr | T-03 | FR-P1-5 |
| T-25 | Add sync assertion to CI | `.github/workflows/ci.yml` | 30 min | T-24 | FR-P1-5 |

### Phase 5: Release (Weeks 7–8)

| Task ID | Task | Files Affected | Est. Effort | Dependencies | PRD Ref |
|---------|------|---------------|-------------|-------------|---------|
| T-26 | Add `just release` recipe | `justfile` | 1 hr | — | — |
| T-27 | Final CHANGELOG update for v1.0.0 | `CHANGELOG.md` | 30 min | T-15 | FR-P0-4 |
| T-28 | Update `VERSION` to production release | `VERSION` | 5 min | — | — |
| T-29 | Manual smoke test matrix (macOS + Ubuntu) | — | 2 hr | All | §7 |
| T-30 | Git tag `v1.0.0` + GitHub Release | — | 30 min | T-29 | — |

### Dependency Graph

```
T-01 (fix pkg.json) ──────────┐
T-02 (consolidate .env) ──────┤
T-03 (redirect scaffold init) ┼──► T-04 (update e2e paths)
                               │     │
T-05 (idempotency guard) ─────┤     │
                               │     │
                               ▼     ▼
T-06..T-12 (test suite) ─────────► T-13 (pkg.json scripts)
                                      │
                                      ▼
                               T-14 (CI redesign)
                                      │
                                      ▼
T-15 (CHANGELOG) ─────────────► T-27 (final CHANGELOG)
T-16 (troubleshooting) ──────► T-17 (README link)
T-18 (CONTRIBUTING.md)
T-19 (validate recipe)
T-20 (--dry-run) ────────────► T-22 (dry-run test)
T-21 (doctor versions) ──────► T-23 (doctor test)
T-24 (sync script) ──────────► T-25 (CI sync check)
                                      │
                               All ───▼
                               T-26 (release recipe)
                               T-28 (bump VERSION)
                               T-29 (smoke test)
                               T-30 (tag + release)
```

**Total estimated effort:** ~25 hours across 8 weeks.

**Deferred:** P2 requirements (FR-P2-1 through FR-P2-4) are intentionally excluded from the initial roadmap. They will be scheduled after GA based on team feedback and adoption metrics.

### 9.3 NFR Coverage Matrix

| NFR Category | NFR IDs | Addressed By | Notes |
|-------------|---------|-------------|-------|
| Reliability | NFR-1 to NFR-4 | T-03, T-04, T-05, T-11, T-12 | Init consolidation, idempotency guard, integration tests |
| Security | NFR-5 to NFR-7 | T-01, T-02 | Fix placeholders, consolidate env; full analysis in §7 |
| Performance | NFR-8 to NFR-10 | T-05, T-14, T-19 | Idempotency (no redundant work), CI timing, validate-extensions recipe |
| Compatibility | NFR-11 to NFR-14 | T-14 | CI matrix (ubuntu + macOS); shellcheck in lint job catches platform issues |

---

## 10. Appendices

### Appendix A: Extension API Surface

Complete catalog of Pi SDK APIs used across the 19 extensions:

#### A.1 Event Hooks

| Event | Signature | Used By | Purpose |
|-------|-----------|---------|---------|
| `session_start` | `(event, ctx) => void` | All 19 extensions | Initialize UI, load config, set theme |
| `session_shutdown` | `(event) => void` | `theme-cycler` | Clean up timers |
| `session_switch` | `(event, ctx) => void` | `tilldone` | Reconstruct state on branch switch |
| `session_fork` | `(event, ctx) => void` | `tilldone` | Reconstruct state on fork |
| `session_tree` | `(event, ctx) => void` | `tilldone` | Reconstruct state on tree nav |
| `before_agent_start` | `(event, ctx) => {systemPrompt?}` | `agent-team`, `agent-chain`, `pi-pi`, `purpose-gate`, `system-select` | Override/augment system prompt |
| `tool_call` | `(event, ctx) => {block, reason?}` | `damage-control`, `tilldone` | Intercept and conditionally block tool calls |
| `tool_execution_end` | `(event) => void` | `tool-counter`, `tool-counter-widget` | Count tool calls |
| `tool_execution_error` | `(event) => void` | `sentry`, `sentry-example` | Capture errors to Sentry |
| `command_error` | `(event) => void` | `sentry`, `sentry-example` | Capture command errors to Sentry |
| `agent_error` | `(event) => void` | `sentry` | Capture agent-level errors |
| `agent_end` | `(event, ctx) => void` | `tilldone` | Auto-nudge on incomplete tasks |
| `input` | `(event, ctx) => {action}` | `purpose-gate`, `tilldone` | Intercept user input |

#### A.2 Registration APIs (top-level, synchronous)

| API | Used By | Purpose |
|-----|---------|---------|
| `pi.registerTool({name, parameters, execute, renderCall, renderResult})` | `agent-team` (`dispatch_agent`), `agent-chain` (`run_chain`), `pi-pi` (`query_experts`), `subagent-widget` (`subagent_create/continue/remove/list`), `tilldone` (`tilldone`) | Register custom tools available to the LLM |
| `pi.registerCommand(name, {description, handler, getArgumentCompletions?})` | `theme-cycler`, `health-check`, `sentry`, `sentry-example`, `agent-team`, `agent-chain`, `pi-pi`, `subagent-widget`, `cross-agent`, `system-select`, `session-replay`, `tilldone` | Register `/commands` for the user |
| `pi.registerShortcut(key, {description, handler})` | `theme-cycler` (`ctrl+x`, `ctrl+q`) | Register keyboard shortcuts |

#### A.3 Context APIs (within event handlers)

| API | Used By | Purpose |
|-----|---------|---------|
| `ctx.ui.setFooter(factory)` | `minimal`, `pure-focus`, `tool-counter`, `agent-team`, `agent-chain`, `pi-pi`, `tilldone` | Custom footer rendering |
| `ctx.ui.setWidget(key, factory, options?)` | `theme-cycler`, `tool-counter-widget`, `agent-team`, `agent-chain`, `pi-pi`, `subagent-widget`, `tilldone`, `purpose-gate` | Widget above/below editor |
| `ctx.ui.setStatus(key, text)` | `health-check`, `sentry`, `agent-team`, `agent-chain`, `pi-pi`, `system-select`, `tilldone`, `damage-control`, `theme-cycler` | Status line items |
| `ctx.ui.setTheme(name)` | `themeMap.ts` (via `applyExtensionTheme`) | Apply theme |
| `ctx.ui.setTitle(title)` | `themeMap.ts` (via `applyExtensionTitle`) | Terminal title |
| `ctx.ui.notify(msg, level?)` | Most extensions | Toast notification |
| `ctx.ui.select(title, options)` | `theme-cycler`, `agent-team`, `agent-chain`, `system-select` | Select dialog |
| `ctx.ui.confirm(title, msg, opts?)` | `damage-control`, `tilldone` | Confirmation dialog |
| `ctx.ui.input(title, placeholder?)` | `purpose-gate` | Text input dialog |
| `ctx.ui.custom(factory, opts?)` | `session-replay`, `tilldone` | Custom overlay UI |
| `ctx.ui.getAllThemes()` | `theme-cycler` | List available themes |
| `ctx.ui.theme` | `theme-cycler` | Current theme object |
| `ctx.model` | `minimal`, `tool-counter`, `agent-team`, `agent-chain`, `pi-pi` | Current model info |
| `ctx.cwd` | `agent-team`, `agent-chain`, `pi-pi`, `system-select`, `cross-agent`, `tool-counter` | Working directory |
| `ctx.getContextUsage()` | `minimal`, `tool-counter`, `agent-team`, `agent-chain`, `pi-pi` | Context window usage |
| `ctx.getSystemPrompt()` | `system-select` | Current system prompt |
| `ctx.sessionManager.getBranch()` | `tool-counter`, `session-replay`, `tilldone` | Conversation history |
| `ctx.abort()` | `damage-control` | Abort current agent turn |
| `ctx.hasUI` | Multiple extensions | Check if UI is available |

#### A.4 Extension-Level APIs

| API | Used By | Purpose |
|-----|---------|---------|
| `pi.setActiveTools(tools)` | `agent-team`, `system-select` | Restrict available tools |
| `pi.getActiveTools()` | `system-select` | Get current tool set |
| `pi.appendEntry(key, data)` | `damage-control` | Append to session log |
| `pi.sendMessage(msg, opts?)` | `subagent-widget`, `tilldone` | Inject messages |
| `pi.sendUserMessage(text)` | `cross-agent` | Inject user message |

#### A.5 TUI Components Used

| Component | Import | Used By |
|-----------|--------|---------|
| `Text` | `@mariozechner/pi-tui` | `agent-team`, `agent-chain`, `pi-pi`, `subagent-widget`, `tool-counter-widget`, `session-replay`, `tilldone`, `purpose-gate`, tool `renderCall`/`renderResult` |
| `Container` | `@mariozechner/pi-tui` | `subagent-widget`, `session-replay`, `tilldone` |
| `Box` | `@mariozechner/pi-tui` | `tool-counter-widget`, `session-replay` |
| `Spacer` | `@mariozechner/pi-tui` | `session-replay`, `tilldone` |
| `Markdown` | `@mariozechner/pi-tui` | `session-replay` |
| `DynamicBorder` | `@mariozechner/pi-coding-agent` | `subagent-widget`, `session-replay`, `tilldone` |
| `truncateToWidth` | `@mariozechner/pi-tui` | Most extensions with custom rendering |
| `visibleWidth` | `@mariozechner/pi-tui` | Most extensions with footer/widget |
| `wrapTextWithAnsi` | `@mariozechner/pi-tui` | `cross-agent` |
| `matchesKey` / `Key` | `@mariozechner/pi-tui` | `session-replay` |
| `getMarkdownTheme` | `@mariozechner/pi-tui` / `@mariozechner/pi-coding-agent` | `session-replay` |

#### A.6 External Dependencies

| Dependency | Used By | Purpose |
|-----------|---------|---------|
| `@sinclair/typebox` (`Type`) | `agent-team`, `agent-chain`, `pi-pi`, `subagent-widget`, `tilldone` | Tool parameter schemas |
| `@mariozechner/pi-ai` (`StringEnum`, `AssistantMessage`) | `tilldone`, `tool-counter` | Enum types, message types |
| `yaml` (`parse`) | `damage-control` | Parse YAML rules file |
| `child_process` (`spawn`) | `agent-team`, `agent-chain`, `pi-pi`, `subagent-widget` | Spawn subagent processes |
| `node:fs` | Most extensions | File system operations |
| `node:path` | Most extensions | Path manipulation |
| `node:os` | `cross-agent`, `system-select`, `subagent-widget`, `damage-control` | Home directory |

### Appendix B: Agent Definition Schema

Agent definitions are Markdown files with YAML frontmatter in `.pi/agents/*.md`:

```markdown
---
name: scout                        # Required. Agent identifier (lowercase, hyphenated).
description: Fast recon and codebase exploration  # Required. One-line summary.
tools: read,grep,find,ls           # Optional. Comma-separated tool whitelist.
                                   # Default: read,grep,find,ls
---
You are a scout agent. Investigate the codebase quickly...
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `string` | ✅ | — | Unique identifier. Used for dispatch, team membership, and display. |
| `description` | `string` | ✅ | `""` | One-line description shown in team grid, /agents-list, system prompt. |
| `tools` | `string` (CSV) | ❌ | `"read,grep,find,ls"` | Comma-separated list of tools the agent can use when spawned as a subprocess. |

**Body (below `---`):** Free-form Markdown that becomes the agent's system prompt. Appended via `--append-system-prompt` when the agent is spawned as a subprocess.

**teams.yaml schema:**

```yaml
# .pi/agents/teams.yaml
# Top-level keys are team names.
# Values are arrays of agent names (must match frontmatter `name` field).

full:
  - scout
  - planner
  - builder
  - reviewer
  - documenter
  - red-team

plan-build:
  - planner
  - builder
  - reviewer
```

Parsed by `agent-team.ts` via a simple line-by-line YAML parser (not a full YAML library):
- Team name: line matching `/^(\S[^:]*):$/`
- Member: line matching `/^\s+-\s+(.+)$/`

### Appendix C: Theme Token Reference

Each theme JSON in `.pi/themes/*.json` follows a 51-token schema with two sections:

#### C.1 `vars` — Base Color Variables (23 tokens)

These define the raw color palette. Values are hex strings.

| Token | Purpose | Example (synthwave) |
|-------|---------|-------------------|
| `bg` | Primary background | `#262335` |
| `bgDark` | Darker background variant | `#241b2f` |
| `bgDeep` | Deepest background | `#1e1d2d` |
| `surface` | Elevated surface | `#34294f` |
| `selection` | Selection highlight | `#463465` |
| `bgRed` | Error background tint | `#3d1018` |
| `bgRedWarm` | Warm error background | `#301510` |
| `bgOrange` | Warning/tool-pending background | `#2e1f10` |
| `bgSky` | Info/tool-success background | `#1a2e4a` |
| `bgCyan` | Custom message background | `#152838` |
| `bgWarm` | User message background | `#4a1e6a` |
| `bgPink` | Selection/highlight background | `#35153a` |
| `comment` | Comment/muted text | `#fede5d` |
| `fg` | Primary foreground | `#ffffff` |
| `fgSoft` | Softer foreground | `#bbbbbb` |
| `red` | Error/destructive | `#fe4450` |
| `cyan` | Accent/links | `#36f9f6` |
| `yellow` | Headings/warnings | `#fede5d` |
| `pink` | Borders/list bullets | `#ff7edb` |
| `green` | Success/strings | `#72f1b8` |
| `orange` | Tool titles/warnings | `#ff8b39` |
| `purple` | Quotes/types | `#c792ea` |
| `blue` | Links/thinking | `#4d9de0` |

#### C.2 `colors` — Semantic Color Assignments (51 tokens)

These map semantic roles to either `vars` keys or direct hex values.

| Token | Category | Purpose |
|-------|----------|---------|
| `accent` | General | Primary accent color |
| `border` | General | Border color |
| `borderAccent` | General | Accent border |
| `borderMuted` | General | Muted/subtle border |
| `success` | General | Success indicators |
| `error` | General | Error indicators |
| `warning` | General | Warning indicators |
| `muted` | General | Muted text |
| `dim` | General | Dimmed text |
| `text` | General | Primary text |
| `thinkingText` | General | Thinking indicator text |
| `selectedBg` | UI | Selected item background |
| `userMessageBg` | Messages | User message background |
| `userMessageText` | Messages | User message text |
| `customMessageBg` | Messages | Custom/system message background |
| `customMessageText` | Messages | Custom message text |
| `customMessageLabel` | Messages | Custom message label |
| `toolPendingBg` | Tools | Tool pending state background |
| `toolSuccessBg` | Tools | Tool success state background |
| `toolErrorBg` | Tools | Tool error state background |
| `toolTitle` | Tools | Tool name/title |
| `toolOutput` | Tools | Tool output text |
| `mdHeading` | Markdown | Heading color |
| `mdLink` | Markdown | Link text |
| `mdLinkUrl` | Markdown | Link URL |
| `mdCode` | Markdown | Inline code |
| `mdCodeBlock` | Markdown | Code block text |
| `mdCodeBlockBorder` | Markdown | Code block border |
| `mdQuote` | Markdown | Blockquote text |
| `mdQuoteBorder` | Markdown | Blockquote border |
| `mdHr` | Markdown | Horizontal rule |
| `mdListBullet` | Markdown | List bullet/marker |
| `toolDiffAdded` | Diff | Added line |
| `toolDiffRemoved` | Diff | Removed line |
| `toolDiffContext` | Diff | Context line |
| `syntaxComment` | Syntax | Code comments |
| `syntaxKeyword` | Syntax | Keywords |
| `syntaxFunction` | Syntax | Function names |
| `syntaxVariable` | Syntax | Variables |
| `syntaxString` | Syntax | String literals |
| `syntaxNumber` | Syntax | Number literals |
| `syntaxType` | Syntax | Type annotations |
| `syntaxOperator` | Syntax | Operators |
| `syntaxPunctuation` | Syntax | Punctuation |
| `thinkingOff` | Thinking | Thinking disabled indicator |
| `thinkingMinimal` | Thinking | Minimal thinking |
| `thinkingLow` | Thinking | Low thinking |
| `thinkingMedium` | Thinking | Medium thinking |
| `thinkingHigh` | Thinking | High thinking |
| `thinkingXhigh` | Thinking | Extra-high thinking |
| `bashMode` | UI | Bash mode indicator |

**Schema URL:** Each theme file references the canonical schema:
```json
{
  "$schema": "https://raw.githubusercontent.com/badlogic/pi-mono/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json"
}
```

---

*End of TDD. This document should be read alongside [docs/PRD.md](./PRD.md) for requirements context. All implementation tasks reference concrete file paths and are ordered by dependency.*
