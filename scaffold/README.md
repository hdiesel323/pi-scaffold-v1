# Pi Project Scaffold

Versioned project templates for bootstrapping new Pi Coding Agent codebases.

## Layout

- `v1/` — current scaffold template
- `init.sh` — creates a new project from a scaffold version

## Usage

```bash
./scaffold/init.sh my-new-project
./scaffold/init.sh my-new-project ~/projects
```

This will:
1. copy `scaffold/v1/` into the target directory
2. replace template placeholders
3. initialize a git repository
4. run `bun install` if Bun is available

## Versioning Strategy

When the scaffold evolves in a meaningful way:
- copy `v1/` to `v2/`
- update `v2/VERSION`
- make changes in the new directory only
- keep older versions intact for reproducible project creation

## Placeholder Tokens

- `{{PROJECT_NAME}}` — human-readable project name
- `{{project-name}}` — slug used in `package.json`
