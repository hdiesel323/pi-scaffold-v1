# Product Requirements Document: Pi Swarm v1.2.0

| Field          | Value                          |
|----------------|--------------------------------|
| **Version**    | 1.2.0                          |
| **Status**     | Active                         |
| **Created**    | 2026-03-23                     |
| **Author**     | Engineering                    |
| **Repo**       | `pi-swarm`                     |

---

## 1. Product Vision

**Pi Swarm** is an autonomous multi-agent swarm orchestration platform built on the Pi Coding Agent. It provides a corporate-scale infrastructure for decentralized task execution, complex workflows, and parallel engineering.

- **Corporate-Scale Roster**: 56+ specialized agents organized into 7 functional divisions (Engineering, Product, Design, Marketing, Sales/Ops, Data, Security).
- **Power Suite Extensions**: A modular toolkit for advanced orchestration, including `ruflo` (YAML workflows), `scrum-master` (automated tracking), and `git-worktree` (parallelism).
- **Standardized Scaffolding**: Rapid injection of the swarm environment into any project via `init.sh`.
- **Diagnostic Rigor**: Comprehensive health checks and safety guardrails (`doctor.sh`, `damage-control`).

### Vision Statement

> Transform single-agent interactions into coordinated swarm intelligence, enabling parallel execution across the entire software development lifecycle.

---

## 2. Completed (v1.0.0, v1.1.0, v1.2.0)

The following requirements have been fully implemented and verified:

- **FR-v1.0-Core**: 18 foundational extensions, 18 initial agents, 11 themes, and 3-tier testing suite.
- **FR-v1.1-Power-Suite**: 7 advanced extensions (`ruflo`, `scrum-master`, `project-planner`, `git-worktree`, `superpowers`, `agent-catalog`, `curator`).
- **FR-v1.1-Roster-Expansion**: Expanded to 51+ agents with v2.1 metadata (capability scores, division tags).
- **FR-v1.2-Rebrand**: Complete standalone rebranding to **Pi Swarm**, removal of legacy comparison dependencies, and archiving of transition documents.
- **FR-v1.2-CI/CD**: Fully operational GitHub Actions pipeline for testing and linting on Linux and macOS.

---

## 3. Phase 3: Swarm Intelligence & Optimization (v1.3.0+)

The next phase of development focuses on developer productivity, ecosystem growth, and shared intelligence.

### P2 — High Priority

| ID        | Requirement                                             | Rationale                                                                                                          |
|-----------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| **FR-P2-1** | **Extension Generator**                                 | `just new-extension <name>` command to scaffold new TypeScript extensions with correct boilerplate and tool registration. |
| **FR-P2-2** | **Bolt-on Marketplace**                                 | Dynamic discovery and installation of external capability packs (bolt-ons) via a centralized manifest. |
| **FR-P2-3** | **Advanced TUI Dashboarding**                           | Multi-pane terminal views or live-updating widgets for monitoring parallel agent activity in real-time. |
| **FR-P2-4** | **Cross-Agent Memory**                                  | Shared state cache or vector database integration to allow agents across different worktrees to share context. |

---

## 4. Agent Census (56 Agents)

The swarm is organized into specialized divisions to mirror a full-scale technology organization:

| Division | Count | Focus Areas |
|----------|-------|-------------|
| **Engineering** | 22 | Architecture, Frontend, Backend, API, DB, DevOps, Mobile, etc. |
| **Security/QA** | 5 | SOC, Pen-Testing, Compliance, QA Automation, Performance. |
| **Marketing** | 6 | SEO, Growth, Content, Social, Email, PPC. |
| **Product** | 4 | PRD Writing, Strategy, User Research, Product Design. |
| **Sales/Ops** | 6 | SDR, CRM, RevOps, Customer Success, Legal, HR. |
| **Data/Insights** | 4 | Analytics, ML, Data Visualization, BI. |
| **Design/UX** | 4 | UX/UI, Visual Design, Motion, Design Systems. |
| **Orchestrators** | 5 | Scrum Master, Planner, Swarm Dispatcher, Ruflo Runner, Curator. |

---

## 5. Success Metrics

- **Swarm Launch Time**: From `init.sh` to first multi-agent task in < 3 minutes.
- **Parallel Capacity**: Successfully managing 3+ concurrent Git worktrees via `git-worktree.ts`.
- **Developer Velocity**: 50% reduction in manual extension boilerplate via Extension Generator.
- **System Health**: 100% pass rate on `just doctor` and `just test` across supported platforms.
