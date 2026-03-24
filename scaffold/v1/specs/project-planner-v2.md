# Project Planner v2 Specification (Expert Panel Upgrade)

The Project Planner v2 upgrade transforms the simple architect interview into a multi-agent collaborative pipeline.

## System Architecture

The upgrade introduces a stateful orchestration layer that moves through distinct phases:

1. **Scouting**: Analyze existing codebase (if any) to understand technical stack and patterns.
2. **Drafting PRD**: The Architect generates the initial Product Requirements Document.
3. **Review PRD**: The user reviews and approves the PRD.
4. **Expert Panel (New)**: Parallel review by specialized agents:
    - **Frontend Expert**: UI/UX, accessibility, state management.
    - **Backend Expert**: Scalability, API design, database schemas.
    - **Security Expert**: Auth, data leakage, injection risks.
5. **Architect Synthesis**: Architect incorporates expert feedback into a final TDD.
6. **Finalization**: Generate PRD, TDD, and ROADMAP.

## New Agents

- `frontend-expert`: Focuses on the "how it looks and feels".
- `backend-expert`: Focuses on "how it scales and stores".
- `security-expert`: Focuses on "how it stays safe".

## State Machine

```typescript
type PlannerState = 
  | 'idle'
  | 'scouting'
  | 'interviewing'
  | 'drafting_prd'
  | 'review_prd'
  | 'expert_panel'
  | 'finalizing';
```
