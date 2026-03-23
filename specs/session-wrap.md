# Specification: Session Wrap System

| Field          | Value                          |
|----------------|--------------------------------|
| **Version**    | 1.0.0                          |
| **Status**     | Stable                         |
| **Extension**  | `session-wrap.ts`              |
| **Agent**      | `closer.md`                    |

## 1. Overview
The Session Wrap system automates the transition between active development and project persistence. It ensures that the current project state, transition notes, and knowledge graphs are synchronized across local, cloud, and Zettelkasten systems before a session ends.

## 2. Functional Requirements
- **FR-1: State Consolidation**: Read and update `.pi/project-state.json`.
- **FR-2: Transition Logging**: Automatically append session summaries to `docs/TRANSITION.md`.
- **FR-3: Knowledge Refresh**: Update `docs/ZETTELGHEST.md` with current agent counts and extension inventory.
- **FR-4: External Persistence**: Sync core documentation to a Google Drive-backed vault.
- **FR-5: History Archiving**: Create timestamped session logs in the cloud archive.
- **FR-6: Zettelkasten Indexing**: Trigger the external MCP indexer to update the project's knowledge graph.
- **FR-7: Unified Memory Sync**: Execute `bd sync` to persist Beads task data.

## 3. Implementation Details
### 3.1 Extension (`session-wrap.ts`)
- Registers `/wrap [summary]` slash command.
- Orchestrates multi-step synchronization via `child_process`.
- Provides visual feedback in the Pi TUI.

### 3.2 Agent (`closer.md`)
- Specialized persona for summarizing technical sessions.
- Responsible for ensuring all PRDs and TDDs are aligned before the wrap command is triggered.

## 4. Configuration (`.pi/wrap-config.yaml`)
Defines paths for:
- `external_vault_path`: Cloud-synced project mirror.
- `archive_logs_path`: Cloud-synced session history.
- `zettelkasten_mcp_path`: Local path to the MCP indexing tool.
