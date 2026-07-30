---
name: develop-pr-workflow
description: Prepare a reviewed feature or fix pull request into `develop`. Use when finished branch work needs base refresh, tests, overlay-aware review, push, and PR creation.
---

# Develop PR Workflow

## Purpose

Use this workflow only for a current `feature/<slug>` or `fix/<slug>` branch that is ready for a PR into `develop`.

## Recommended Reasoning

Default: `high`

Use `xhigh` for large branches, conflicts, failing or flaky tests, or security-, payment-, migration-, or permission-sensitive changes.

## Safety Gates

- Do not use this workflow for `master`, hotfixes, release branches, or branch creation.
- Check `git status --short` before every branch switch or merge phase. Stop if local changes make the operation unsafe; do not force, reset, or discard them.
- Refresh `develop` before the PR. Merge it into the working branch only when it is not already an ancestor.
- Do not open the PR when supported tests fail or review has unresolved blocking findings.
- Keep the review scoped to `git diff --name-only develop...HEAD`.

## Overlay Discovery

Before review, inspect the hidden `.agents/skills/` directory and `codex-skills.json.local_overrides` when present.

Apply a project-local review overlay when either:

- `local_overrides.review-workflow` points to an existing `.agents/skills/<overlay>/SKILL.md`; or
- an unmanaged discovered skill under `.agents/skills/` clearly provides project review rules, such as `local-review-workflow`.

Validate the path and read the overlay before applying it. Do not require or use an `AGENTS.md` registration entry as an overlay signal.

## Workflow

1. Record the current `feature/` or `fix/` branch and confirm the worktree is safe.
2. Switch to `develop`, pull its remote updates, then switch back.
3. Run `git merge-base --is-ancestor develop HEAD`.
4. If current `develop` is not contained, merge it into the working branch and resolve conflicts. If it is contained, skip the no-op merge.
5. Check `make -n test`. Run `make test` only when that target exists; otherwise continue and report the gap.
6. Build the branch file list with `git diff --name-only develop...HEAD`.
7. Run [review-workflow](../review-workflow/SKILL.md) on those files and apply every validated local review overlay discovered above.
8. Resolve and recheck blocking findings when in scope, or stop and report them.
9. Push the working branch, including any merge commit.
10. Create a PR whose base is `develop` and head is the current working branch.
11. Verify the PR and report its URL, source/base branches, test result, review result, and applied overlays.

## Commands

```bash
git status --short
git switch develop
git pull
git switch <feature-or-fix-branch>
git merge-base --is-ancestor develop HEAD || git merge develop
if make -n test >/dev/null 2>&1; then make test; fi
git diff --name-only develop...HEAD
git push -u origin <feature-or-fix-branch>
gh pr create --base develop --head <feature-or-fix-branch>
```

Do not run the merge fallback blindly after conflicts or another failure; inspect the actual exit reason.

## PR Body

Write a factual Russian summary in 3–5 sentences. Describe the branch's main user-facing or technical changes and verification. State `make test: passed`, or name why it was unavailable or blocked. Do not fill the body with merge mechanics.

Example:

```text
В ветке добавлен экспорт заказов из панели.
API формирует согласованный набор данных и возвращает готовый файл.
Связанные действия интерфейса обновлены под новый сценарий.
make test: passed; изменения ветки проверены review-workflow.
```

## Completion Criteria

The workflow is complete only when:

- current `develop` is contained in the source branch;
- supported tests passed, or the missing target/infrastructure blocker is explicit;
- branch-changed files passed shared and discovered overlay review gates;
- the branch is pushed;
- a PR exists from the correct `feature/` or `fix/` branch into `develop` with a concise Russian summary.
