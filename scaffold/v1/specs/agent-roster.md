# Agent Roster Specification v2.1 (The Corporate Edition)

The Roster system expands to a divisional structure to support enterprise-scale agent orchestration.

## Frontmatter Standard v2.1

Every agent MUST define the following metadata:

- `name`: Unique identifier (e.g., `scout`).
- `division`: The organizational unit (e.g., `Eng`, `Prod`, `Design`, `Mktg`, `Ops`, `Data`, `Sec`).
- `description`: One-line summary of role.
- `tools`: Comma-separated tool permissions.
- `version`: Persona version (default `1.0.0`).
- `tags`: Array of domain tags.
- `capability_score`: Logic rating (1-10).

## Organizational Divisions

1. **Eng (Engineering)**: Development, Architecture, DevOps.
2. **Prod (Product)**: Strategy, Backlog, Research.
3. **Design**: UI, UX, Brand.
4. **Mktg (Marketing)**: Growth, Content, SEO.
5. **Ops (Operations/Sales)**: Success, Legal, Support.
6. **Data**: Analysis, DB, ML.
7. **Sec (Security/QA)**: Audit, Test, Compliance.
