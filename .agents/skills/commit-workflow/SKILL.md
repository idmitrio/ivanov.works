---
name: commit-workflow
description: Prepare and create focused commits using the repository's local stage rules and Conventional Commits. Use when Codex needs to decide what to include in a commit, choose the right commit type and scope, or avoid mixing unrelated changes.
---

# Commit Workflow

## Overview

Use this skill when the task is to create, review, or prepare a commit.

Read the repository's commit-related instructions first. Use this file for the practical workflow and for the generic Conventional Commits rules that apply across projects.

## Capabilities

- Build focused commits from accepted work.
- Keep unrelated or unconfirmed changes out of the commit.
- Choose a Conventional Commits type, optional scope, and concise description.
- Split changes when a single commit would mix different intentions.

## Workflow

1. Confirm that the user explicitly accepted the stage or otherwise asked for a commit.
2. Inspect `git status` and `git diff` before staging anything.
3. Keep the commit focused on one accepted stage or one coherent change.
4. Stage only the files that belong to that scope.
5. Avoid staging unrelated user changes.
6. Write a Conventional Commit message and apply any repository-local suffixes or trailers only when the repository instructions require them.
7. Create the commit.
8. Report the commit hash and message back to the user.

## Required Rules

- Do not create a commit for a stage until the user explicitly confirms that the stage is accepted.
- Do not combine multiple unconfirmed stages into one commit unless the user explicitly asks for that.
- Keep commits focused and reviewable.
- Do not amend a commit unless the user explicitly asks for it.
- Do not revert unrelated user changes while preparing the commit.

## Not Supported

- Do not decide release versioning or changelog content with this skill.
- Do not rewrite existing history, squash commits, or amend commits unless the user explicitly asks for that operation.
- Do not stage broad path patterns in a dirty worktree when explicit file paths can avoid unrelated changes.

## Commit Message Rule

Commit messages must follow Conventional Commits.

Format:

```text
<type>[optional scope]: <description>

[optional body]
[optional footer(s)]
```

Example:

```text
feat(settings): add panel script settings
```

## Conventional Commit Type Selection

- Use `feat` when the commit adds a new feature to the application or library.
- Use `fix` when the commit represents a bug fix for the application.
- Use `docs`, `build`, `chore`, `ci`, `refactor`, `style`, `test`, or other project-recognized types when the change is neither a feature nor a bug fix.
- Additional types are allowed by Conventional Commits, but they do not have an implicit SemVer effect unless the commit is marked as a breaking change.
- Mark breaking changes with `!` before the colon, a `BREAKING CHANGE:` footer, or both.
- If the change fits more than one type, split it into multiple focused commits whenever practical.

## Scope Selection

- A scope is optional.
- Use a scope when it adds useful context about the affected section of the codebase.
- The scope should be a noun, for example `api`, `parser`, `settings`, or `tests`.
- Do not use a broad scope when a narrower, stable codebase section is clearer.

## Staging Guidance

- Prefer staging explicit file paths instead of broad patterns when the worktree is dirty.
- If unrelated changes are present, leave them unstaged.
- If the relevant files contain both intended and unrelated edits, review carefully before staging and do not discard user work.

## Examples

Focused documentation commit:

```bash
git status --short
git diff -- docs/usage.md
git add docs/usage.md
git commit -m "docs(usage): clarify setup steps"
```

Focused feature commit with a repository-local suffix:

```bash
git status --short
git diff -- app/settings.py tests/test_settings.py
git add app/settings.py tests/test_settings.py
git commit -m "feat(settings): add default timezone"
```

## Pre-Commit Checklist

- The user approved this stage for commit.
- The staged diff matches one coherent scope.
- The commit message is Conventional Commits compliant.
- Any repository-local commit message requirements have been applied.
- No unrelated changes were silently included.

## Verification

A commit is ready when the staged diff contains one coherent change, the message follows Conventional Commits plus any repository-local requirements, unrelated work remains unstaged, and the resulting commit hash and message can be reported to the user.

## Output

After committing, provide:

- the commit hash
- the exact commit message
- a short note on what was included if the scope is not obvious from the message
