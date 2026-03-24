# Memory System

Pi Swarm now includes a memory cave at two levels:

1. system-wide in the toolkit repo itself
2. project-local inside generated or brownfield-injected projects

Both use the same `.pi/memory/` layout.

This is the base for a future `librarian` or `memory-cave` extension.

## Design

The storage model has three layers:

1. Local files in `.pi/memory/`
2. Summaries in `docs/ZETTELKASTEN.md` and `docs/TRANSITION.md`
3. Optional external services:
   - Zettelkasten MCP
   - vector API
   - database API

## Filesystem-First Rule

Pi Swarm uses a filesystem-first memory model.

That means:

- memory is written to files first
- agents explore memory with normal file and shell operations
- external backends are optional sync and retrieval layers

This is intentional. It keeps memory:

- debuggable
- human-readable
- easy to rebuild
- resilient when an external backend is unavailable

The design is aligned with Vercel's filesystem-and-bash agent pattern:

- [How to build agents with filesystems and bash](https://vercel.com/blog/how-to-build-agents-with-filesystems-and-bash)

## Canonical Rule

The file system is canonical.

External systems are synchronization and retrieval backends, not the only copy of memory.

## Scope Rules

- Root `~/pi-swarm/.pi/memory/` is for toolkit-wide knowledge.
- Project `./.pi/memory/` is for repo-specific knowledge.
- Do not mix them unless a fact truly belongs to both scopes.

## Included Files

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

## Write and Sync Flow

The intended write path is:

1. write canonical memory into `.pi/memory/...`
2. update summaries such as `docs/ZETTELKASTEN.md` and `docs/TRANSITION.md`
3. optionally export promoted notes to the user's external Zettelkasten
4. optionally index or mirror the same knowledge into vector and database backends

This keeps the local file system as the source of truth while still supporting semantic retrieval and reporting.

## Promotion Rules

Promote to external Zettelkasten when content is:

- durable
- reusable
- understandable outside the repo
- worth keeping in the user's broader knowledge system

Keep local-only by default when content is:

- scratch material
- noisy inbox capture
- incomplete work fragments
- temporary session debris

## Backend Stub

Both the toolkit repo and the scaffold include a backend config stub at `.pi/memory/config.yaml`.

It supports three backend classes:

- `zettelkasten_sync`
- `vector_backend`
- `database_backend`

All optional integrations are disabled by default.

## Env Vars

Both root and scaffold `.env.sample` include placeholders for:

- `MEMORY_EMBEDDING_PROVIDER`
- `MEMORY_EMBEDDING_MODEL`
- `VECTOR_API_URL`
- `VECTOR_API_KEY`
- `VECTOR_API_INDEX`
- `VECTOR_API_NAMESPACE`
- `MEMORY_DATABASE_URL`
- `MEMORY_DATABASE_TOKEN`
- `MEMORY_DATABASE_SCHEMA`
- `MEMORY_DATABASE_COLLECTION`

## Next Build Step

The intended next implementation is a dedicated extension that can:

- capture notes into `.pi/memory/inbox/`
- promote durable knowledge into the correct folder
- query file memory first
- optionally push or query vector/database backends
- generate handoff context for the next agent

## References

- [Vercel: How to build agents with filesystems and bash](https://vercel.com/blog/how-to-build-agents-with-filesystems-and-bash)
