# ZETTELKASTEN: Pi Swarm Knowledge Base

This document is the canonical project knowledge base for Pi Swarm v1.2.1.

It exists so session wrap, handoff, and external knowledge sync all point to one standard note name instead of an internal typo.

## 🏗 Core Architecture
Pi Swarm is a layered multi-agent orchestration platform built on top of the Pi Coding Agent.

1.  **Scaffold Layer**: Standardized project layouts, agent environments, and boilerplate injection (`init.sh`).
2.  **Runtime Layer**: High-speed TypeScript execution (jiti) for extensions and middleware.
3.  **Extension Layer (Power Suite)**: Advanced capabilities like `ruflo` (workflows), `scrum-master` (tracking), and `git-worktree` (parallelism).
4.  **Agent Layer**: 56+ specialized personas organized into functional **Divisions**.

## 👥 Agent Roster (56 Agents)
Agents are classified by **Division** with specific metadata (capability scores, focus areas).

- **Engineering (22)**: Architecture, Backend, Frontend, API, Database, DevOps, etc.
- **Product (4)**: Strategy, PRD, User Research, Product Design.
- **Design/UX (4)**: UX/UI, Visual Design, Motion, Design Systems.
- **Marketing (6)**: SEO, Content, Growth, Social, Email, PPC.
- **Sales/Ops (6)**: SDR, CRM, RevOps, Customer Success, Legal, HR.
- **Data/Insights (4)**: Analytics, Machine Learning, Data Viz, BI.
- **Security/QA (5)**: SOC, Pen-Test, Compliance, QA Automation, Performance.
- **Orchestrators (5)**: Scrum Master, Project Planner, Swarm Dispatcher, Ruflo Runner, Curator.

## 🔌 Power Suite Extensions
- `scrum-master`: Automated sprint tracking and backlog sync.
- `project-planner-v2`: AI-driven requirements discovery and doc generation.
- `git-worktree`: Native parallel execution for complex branching tasks.
- `superpowers-v2`: High-leverage Git operations and advanced skill packs.
- `agent-catalog`: Directory and health monitoring for all 56+ agents.
- `ruflo`: Declarative YAML-based multi-agent workflow engine.
- `curator`: Upstream repository monitoring and feature alignment.

## 🚀 Launch Modes
- `scrum`: Focused task execution with automated status updates.
- `planner`: Interactive scoping and project scaffolding.
- `workflow`: Execution of complex multi-step `ruflo` blueprints.
- `power-suite`: Full utility mode with advanced Git and system tools.

## 📂 Key Paths
- `.pi/agents/`: Agent personas and team definitions.
- `.pi/themes/`: Visual styling (13+ themes).
- `extensions/`: TypeScript logic for all swarm capabilities.
- `specs/`: Technical blueprints for Power Suite components.
- `docs/archive/`: Legacy comparison and reference documents.

---
*Last Sync: 2026-03-23 | Version: 1.2.1*
