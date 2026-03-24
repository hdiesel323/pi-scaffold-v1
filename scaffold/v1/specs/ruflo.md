# Ruflo Workflow Engine Specification

The Ruflo system enables complex, multi-step agent choreographies defined as declarative YAML flows.

## Components

1. **Flow Supervisor Agent**: Orchestrates task transitions, evaluates conditions, and manages shared state.
2. **Workflow Definition**: YAML files in `.pi/flows/` defining task IDs, agents, prompts, and transition logic.
3. **Ruflo Extension**: The execution runtime for flows, providing TUI visibility and command-driven control.

## State Management

Flow states are persisted in `.pi/chronicle/flows/<uuid>.json`:
- `current_task_id`: The ID of the currently executing task.
- `shared_context`: A key-value store available to all tasks in the flow.
- `history`: Record of completed tasks and their outputs.

## Transitions

- `next`: Sequential progression.
- `gate`: Transitions requiring manual `/flow-approve`.
- `condition`: Logic-based branching based on agent output.
- `on_fail`: Error recovery paths.
