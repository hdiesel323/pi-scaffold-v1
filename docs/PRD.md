# Product Requirements Document: Pi Swarm v1.3.0

| Field | Value |
|---|---|
| **Version** | 1.3.0 |
| **Status** | Active |
| **Created** | 2026-03-23 |
| **Author** | Engineering |
| **Repo** | `pi-swarm` |

## 1. Product Vision

Pi Swarm v1.3.0 advances the platform from a stable multi-agent toolkit into a more intelligent orchestration system centered on developer velocity, shared context, and lower operational friction.

Vision statement:

> Transform Pi Swarm from a configurable swarm toolkit into a filesystem-first intelligence layer for parallel agent execution.

## 2. Current Product Baseline

The current stable baseline is v1.2.1.

Implemented and verified:

- stable multi-agent roster and team launcher flows
- advanced launch stacks for planning, scrum, workflow, and full orchestration
- scaffold and brownfield install path
- diagnostics via `doctor.sh`
- session wrap, handoff, and canonical `ZETTELKASTEN` knowledge summary
- filesystem-first memory scaffolding with optional external backend stubs

## 3. User Insights and Pain Points

Research and usage feedback identify four persistent issues:

1. **Onboarding Friction**
Manual extension setup, config placement, and recipe discovery still create avoidable setup mistakes.

2. **Split-Brain Parallel Work**
Agents running in separate Git worktrees do not share enough active context, leading to duplicate work and inconsistent assumptions.

3. **Tooling Complexity**
Users still need to remember too many launcher patterns and setup rules.

4. **Environment Stability**
Users depend on better diagnostics and predictable setup surfaces before they trust the swarm in daily work.

## 4. Product Strategy for v1.3.0

The v1.3.0 strategy is:

- reduce time-to-first-extension
- establish a filesystem-first shared memory foundation
- keep external systems optional and secondary
- prepare the platform for future marketplace and observability work without overbuilding them now

## 5. Prioritized Backlog

| Priority | ID | Initiative | Outcome |
|---|---|---|---|
| P0 | FR-1301 | Extension Generator | `just new-extension <name>` scaffolds a correct extension with tests, docs, and recipe wiring |
| P0 | FR-1302 | Cross-Agent Shared Memory | Shared context works across parallel worktrees using filesystem-first storage and optional sync/index backends |
| P1 | FR-1303 | Bolt-on Marketplace | Standardized discovery and installation of external swarm capability packs |
| P2 | FR-1304 | TUI Activity Dashboards | Better runtime visibility into swarm activity, health, and coordination |

## 6. v1.3.0 Scope

In scope:

- extension scaffolding workflow
- shared-memory foundation
- memory commands and sync model
- project-management updates and implementation docs
- doctor and scaffold hooks required to support the new surfaces

Out of scope for v1.3.0:

- full marketplace implementation
- advanced live dashboards beyond minimal hooks
- production-grade hosted memory service

## 7. Sprint 1 Plan

Sprint goal:

> Automate extension creation and establish the first working cross-worktree memory layer.

Sprint work:

1. **Extension Generator**
   - add `just new-extension <name>`
   - scaffold extension source, spec, and test file
   - optionally update `justfile` recipe catalog

2. **Shared Memory Foundation**
   - implement filesystem-first shared memory outside individual worktree roots
   - provide `memory_set`, `memory_get`, `memory_search`, and `memory_sync` tooling
   - promote durable knowledge into repo memory and `docs/ZETTELKASTEN.md`

3. **Diagnostics and Validation**
   - extend doctor checks for memory configuration
   - add tests for extension generation and shared-memory behavior

## 8. Acceptance Criteria

### FR-1301 Extension Generator

- `just new-extension foo-bar` creates a valid extension scaffold
- generated files follow Pi Swarm conventions
- generated code imports cleanly
- docs and spec stubs are created
- users can reach a working extension in materially less time than manual creation

### FR-1302 Cross-Agent Shared Memory

- two agent sessions in separate worktrees can read and write shared context
- canonical durable memory remains filesystem-first
- the design does not depend on a vector DB to function
- vector and database backends remain optional accelerators
- promotion from shared context into durable project memory is supported

## 9. Success Metrics

- **Time-to-First-Extension**: 50% reduction relative to manual extension setup
- **Cross-Worktree Recall**: successful context handoff between two worktrees in a verified smoke test
- **Setup Reliability**: `just doctor` and install flow remain green after the new features land
- **Operational Clarity**: users can discover the relevant launcher or command without memorizing internal paths
