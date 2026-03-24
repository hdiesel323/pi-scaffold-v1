# Project Planner System Specification

The Project Planner system is designed to automate the initial phase of software development by generating professional-grade product and technical documentation from a high-level goal.

## Components

1. **Architect Agent**: A specialized persona focused on requirements gathering and technical architecture.
2. **Project Templates**: Standardized structures for PRDs, TDDs, and Roadmaps.
3. **Planner Extension**: Orchestrates the interaction between the user, the Architect agent, and the filesystem.

## Workflow

1. User initiates planning via `/plan <goal>`.
2. Architect agent conducts a requirements interview.
3. Once satisfied, the `generate_project_plan` tool is invoked.
4. The system produces `docs/PRD.md`, `docs/TDD.md`, and `ROADMAP.md`.

## Deliverables

- `PRD.md`: Vision, target users, user stories, and functional/non-functional requirements.
- `TDD.md`: Architecture overview, component map, testing strategy, and security considerations.
- `ROADMAP.md`: Phase-based implementation plan.
