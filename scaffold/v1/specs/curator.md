# Curator System Specification

The Curator system ensures the toolkit remains aligned with the leading edge of the AI agent ecosystem by monitoring upstream repositories and proposing architectural or behavioral updates.

## Components

1. **Curator Agent**: Specialized in pattern recognition, gap analysis, and cross-repository synthesis.
2. **Upstream Registry**: YAML configuration of key repositories to watch.
3. **Curation Extension**: Orchestrates the fetch-analyze-propose-apply loop.

## Workflow

1. **Crawl**: Fetch latest READMEs/documentation from the upstream registry using `gh` or `curl`.
2. **Analyze**: Compare upstream capabilities with the local `extensions/` and `specs/`.
3. **Propose**: Generate structured update proposals stored in `curation-log.json`.
4. **Apply**: Automate the implementation of proposals via the `builder` agent.

## Upstream Registry

- `ruvnet/ruflo`: Workflow engine reference.
- `hdiesel323/gsd`: General shell distributor patterns.
- `hdiesel323/claude-task-master`: Task management references.
- `mariozechner/pi-coding-agent`: Core runtime updates.
- `hdiesel323/agency-agents`: Roster and persona updates.
