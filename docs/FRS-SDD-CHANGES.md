# FRS/SDD Terminology Update

**Date:** 2026-03-26
**Status:** Completed

## Summary

The planning system has been updated to use clearer, more focused documentation terminology:

| Old | New | Purpose |
|-----|-----|---------|
| PRD (Product Requirements Document) | FRS (Functional Requirements Spec) | User-facing desired state |
| TDD (Technical Design Document) | SDD (System Design Document) | Technical implementation |
| ROADMAP.md | — | Removed (redundant) |

---

## What Changed

### 1. Extensions: `project-planner.ts`
- Tool description now references "FRS and SDD"
- Output files: `PRD.md` → `FRS.md`, `TDD.md` → `SDD.md`
- Prompts updated to use new terminology

### 2. Agent: `.pi/agents/architect.md`
- Complete rewrite with clear, focused prompts
- Defines FRS as "user-facing desired state. No technical details. No fluff."
- Defines SDD as "Technical implementation details only."

### 3. Specifications: `specs/project-planner.md` & `specs/project-planner-v2.md`
- All PRD/TDD/ROADMAP references updated
- Workflows updated to produce FRS.md and SDD.md only

---

## New FRS Template

**Purpose:** User-facing desired state. No technical details.

```markdown
## FRS - Functional Requirements Spec

### Overview
One paragraph describing what this is.

### Users
Who uses it and their goals.

### Requirements
Numbered list of functional requirements.

### Out of Scope
What this explicitly does NOT cover.

### Edge Cases
Key scenarios to handle.

**DO NOT include:** Success metrics, goals, roadmap, implementation notes, technical architecture.
```

---

## New SDD Template

**Purpose:** Technical implementation details only.

```markdown
## SDD - System Design Document

### Architecture
High-level component diagram.

### Data Model
Key entities and relationships.

### API Surface
Endpoints and contracts.

### Security
Auth, data handling, potential risks.

### Implementation Phases
Numbered steps for building.
```

---

## Old vs New Approach

### Before (PRD/TDD)

| Aspect | Description |
|--------|-------------|
| **PRD** | Product Requirements Document - often became bloated with business context, success metrics, and technical hints |
| **TDD** | Technical Design Document - ambiguous name (often confused with Test-Driven Development) |
| **ROADMAP** | Separate roadmap file - redundant with implementation phases |

### After (FRS/SDD)

| Aspect | Description |
|--------|-------------|
| **FRS** | Functional Requirements Spec - strictly user-facing, no implementation details allowed |
| **SDD** | System Design Document - strictly technical, no business context |
| **Scope** | Two documents only, no roadmap redundancy |

### Key Improvements

1. **Clearer names** - FRS/SDD are unambiguous
2. **Strict separation** - User state vs. technical implementation
3. **Less fluff** - Explicit "do not include" sections
4. **Actionable** - "Write both documents. Be concise. Prefer lists over paragraphs."

---

## Files Modified

```
extensions/project-planner.ts
.pi/agents/architect.md
specs/project-planner.md
specs/project-planner-v2.md
```

## Patch File

For applying these changes elsewhere:
```
patches/frs-sdd-changes.patch
```

---

## Notes

- Existing projects with `PRD.md`/`TDD.md` files will continue to work
- The `generate_project_plan` tool now outputs `FRS.md` and `SDD.md`
- The architect agent has been completely rewritten for clarity
