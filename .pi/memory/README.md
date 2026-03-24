# Pi Swarm Memory Cave

This folder is the system-wide memory cave for the Pi Swarm toolkit itself.

Use it for durable knowledge that should live at the toolkit level rather than inside a single injected project.

## When to Store Here

Store information here when it applies across projects:

- swarm operating patterns
- extension behavior notes
- integration runbooks
- release lessons
- durable architectural decisions about Pi Swarm itself

Store project-specific knowledge inside that project's own `.pi/memory/` folder.

## Layout

```text
.pi/memory/
  README.md
  config.yaml
  index.md
  inbox/
  sessions/
  decisions/
  entities/
  runbooks/
  patterns/
  archives/
```

## Canonical Rule

The file system is canonical.

External systems such as Zettelkasten MCP, vector APIs, and database APIs are sync or retrieval backends, not the only source of truth.

## Operating Model

Write to local files first.

Then optionally:

- update summary docs
- export promoted notes to the external Zettelkasten
- index the same content into vector or database backends

This follows a filesystem-first agent design, similar to:

- [Vercel: How to build agents with filesystems and bash](https://vercel.com/blog/how-to-build-agents-with-filesystems-and-bash)
