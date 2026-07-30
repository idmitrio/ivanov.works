---
name: git-branch-workflow
description: Create new feature and fix branches for this repository using its local branching rules. Use when Codex needs to create a development branch from updated `develop` and keep the branch name aligned with the requested work item.
---

# Git Branch Workflow

## Overview

Use this skill when the task is to create a new development branch in this repository for work that will return to `develop`.

Read the repository workflow rules in [AGENTS.md](../../../AGENTS.md) first. Use this file for the practical branching procedure.

## Capabilities

- Create `feature/<slug>` branches from updated `develop`.
- Create `fix/<slug>` branches from updated `develop`.
- Derive lowercase hyphenated branch names from task summaries.
- Stop safely when local changes would block switching or pulling.
- Route release and hotfix branch requests to [release-workflow](../release-workflow/SKILL.md).

## Supported Branch Types

- `feature` branches are created from `develop`
- `fix` branches are created from `develop`

## Use Another Workflow

- Use [release-workflow](../release-workflow/SKILL.md) for `release-{ver}` branches.
- Use [release-workflow](../release-workflow/SKILL.md) for `hotfix-{ver}` branches and hotfix releases.
- Use [develop-pr-workflow](../develop-pr-workflow/SKILL.md) when a finished `feature/` or `fix/` branch needs a PR back into `develop`.

## Not Supported

- Do not create `release-{ver}` or `hotfix-{ver}` branches with this workflow.
- Do not open PRs, merge branches, tag releases, or delete branches with this workflow.
- Do not bypass local changes with destructive git commands.

## Workflow

1. Confirm which branch type is requested: `feature` or `fix`.
2. Derive the target branch name from the task slug.
3. Check `git status --short` before switching branches.
4. If local changes would block branch switching or pulling, stop and surface that risk instead of forcing the workflow.
5. Switch to `develop`.
6. Update `develop` with `git pull` before creating the new branch.
7. Create the new branch from the updated base branch.
8. Report the created branch name and that it was created from updated `develop`.

## Naming Guidance

Use a lowercase slug with hyphens.

Preferred naming:

- `feature/<slug>`
- `fix/<slug>`

Examples:

- `feature/order-export`
- `fix/panel-auth-timeout`

## Base Branch Rules

- Never create a `feature` branch from `master`.
- Never create a `fix` branch from `master`.
- Always refresh `develop` before creating `feature` or `fix`.

## Practical Commands

For a feature or fix branch:

```bash
git status --short
git switch develop
git pull
git switch -c feature/order-export
```

```bash
git status --short
git switch develop
git pull
git switch -c fix/panel-auth-timeout
```

## Checklist

- The requested branch type is one of `feature` or `fix`.
- The branch name uses a lowercase hyphenated slug.
- `develop` was updated before `feature` or `fix`.
- No destructive git command was used to bypass local changes.

## Verification

The workflow is complete when the current branch is the newly created `feature/<slug>` or `fix/<slug>` branch, it was created after `develop` was refreshed, and no unrelated local changes were forced through branch switching.
