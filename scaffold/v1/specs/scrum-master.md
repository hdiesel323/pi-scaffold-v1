# Scrum Master System Specification

The Scrum Master system is designed to provide automated project management, task tracking, and workflow orchestration within the Pi Agent environment.

## Components

1. **Scrum Master Agent**: A specialized persona focused on agile methodology, task prioritization, and bottleneck identification.
2. **Project State**: A persistent JSON file (`.pi/project-state.json`) that acts as the single source of truth for task progress.
3. **Scrum Extension**: Provides the TUI dashboard, slash commands, and logic to sync the state with Markdown roadmaps.

## Workflow

1. **Initialization**: On boot, the system parses `ROADMAP.md` to populate `.pi/project-state.json`.
2. **Execution**:
    - User/Agent uses `/next` to determine the highest priority task.
    - Status is tracked via `/complete` and `/block`.
3. **Reporting**: `/status` provides a real-time dashboard, and `/standup` generates daily progress summaries.

## Data Schema

```json
{
  "tasks": [
    {
      "id": "1.1",
      "title": "Setup repository",
      "status": "done",
      "assignedTo": "builder",
      "updatedAt": "2026-03-23T..."
    }
  ],
  "activeTaskId": "1.2"
}
```
