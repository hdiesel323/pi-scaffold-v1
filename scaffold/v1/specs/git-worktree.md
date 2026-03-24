# Git Worktree System Specification

The Git Worktree system enables parallel task execution by allowing multiple branches to be checked out simultaneously in sibling directories.

## Components

1. **Git Specialist Agent**: Specialized in complex git operations, conflict resolution, and worktree management.
2. **Worktree Extension**: Provides slash commands for managing worktrees and a TUI overlay for visibility.
3. **Scrum Integration**: The Scrum Master can automatically provision worktrees for new parallel tasks.

## Workflow

1. **Provisioning**: User or Scrum Master calls `/wt-add <branch>`. A new sibling directory is created.
2. **Synchronization**: `/wt-sync <target-path>` moves uncommitted changes from the current worktree to another using git stash.
3. **Cleanup**: `/wt-remove <path>` prunes the worktree and cleans up the git metadata.

## TUI Visibility

- **Footer**: Shows `🌿 [branch-name] @ [worktree-folder]`.
