# Git Superpowers v2 Specification (Skill Pack)

The Git Superpowers v2 upgrade extends the core Git capabilities with a "Skill Pack" that bridges the gap between local Git operations, external collaboration platforms, and research/data analysis tools.

## v2 Superpowers (Skill Pack)

1. **GitHub Integration (/sp-pr)**: Automated PR creation and lifecycle management using `gh` CLI.
2. **Technical Research (/sp-search)**: Deep research synthesis using the `search-expert` agent.
3. **Database Inspection (/sp-db)**: Direct SQL analysis of local data stores using `sqlite3`.
4. **Active Notifications (/sp-notify)**: Webhook integration for Slack/Discord alerts.
5. **Documentation Sync (/sp-sync-docs)**: Automated documentation layer alignment.

## Components

- **Specialist Agents**: `github-expert`, `search-expert`, `db-expert`.
- **Tooling**: `gh` CLI, `sqlite3`, `fetch` API.
- **Environment**: New secrets for GitHub, Tavily, Notion, and Slack.
