---
name: release-workflow
description: Prepare and complete guarded releases or hotfixes. Use when versioning, overlay-aware review, changelog approval, PR merge, tagging, cleanup, and branch synchronization are required.
---

# Release Workflow

## Purpose

Use this workflow to create `release-{version}` from updated `develop`, start `hotfix-{version}` from updated `master`, or release an existing hotfix into `master`.

## Recommended Reasoning

Default: `high`

Use `xhigh` for major or urgent releases, conflicts, failed gates, migrations, security-sensitive changes, or material rollback risk.

## Supported Paths

- `develop` → new `release-{version}` → PR into `master`.
- `master` → new `hotfix-{version}` and stop until the fix is complete.
- existing `hotfix-{version}` → PR into `master`.

Never release directly from `feature/` or `fix/`, open a release PR directly from `develop`, or delegate release/hotfix branch creation to [git-branch-workflow](../git-branch-workflow/SKILL.md).

## Mandatory Safety Gates

- Check `git status --short` before switching, pulling, merging, or preparing release files. Stop rather than force through unsafe local changes.
- Resolve one canonical version first. Convert `X.Y` to `X.Y.0` and remove a leading `v`; use it consistently in branch names, version files, changelog heading, commit, and `v{version}` tag.
- Run supported tests and [review-workflow](../review-workflow/SKILL.md) before release edits. Do not proceed with failing tests or unresolved blocking findings.
- Update every verified runtime, package, manifest, docs, deployment, or generated version surface. A changelog entry and tag do not replace project version changes.
- Stop after preparing the changelog. Do not commit, push, create or merge the PR, tag, or clean branches until the user explicitly approves the changelog text.
- Never bypass merge conflicts, unknown merge blocks, or failing required checks.
- Never delete `master`, `develop`, or `preprod`.

## Overlay Discovery

Inspect the hidden `.agents/skills/` directory and `codex-skills.json.local_overrides` before version edits and review.

- Apply an existing mapped release/version overlay when it provides project-specific version surfaces or release rules.
- Apply `local_overrides.review-workflow` when it points to an existing `.agents/skills/<overlay>/SKILL.md`.
- Also consider clearly named unmanaged local release or review skills discovered under `.agents/skills/`.

Validate and read each overlay before using it. Do not require or treat an `AGENTS.md` registration entry as an overlay signal.

## Preparation Workflow

1. Classify the requested path and canonicalize the version.
2. Ensure the worktree is safe, switch to the base/source branch, and pull it.
3. For a new hotfix, create `hotfix-{version}` from updated `master`, report it, and stop until the fix is complete.
4. On updated `develop` or an existing hotfix, check `make -n test`; run `make test` once only when supported. Stop on failure.
5. From `develop`, create `release-{version}`. For a hotfix release, stay on the existing matching branch.
6. Review `git diff --name-only master...HEAD` with [review-workflow](../review-workflow/SKILL.md) plus discovered review overlays. Resolve or report blockers.
7. Apply discovered project release/version rules. Otherwise inspect release docs, manifests, common version identifiers, and the previous version. Ask only if no reliable version surface can be determined.
8. Update all required version surfaces and confirm them in `git diff`.
9. Use [changelog-workflow](../changelog-workflow/SKILL.md) to prepare the release entry and compare link in the repository's existing style.
10. Build broad, user-facing notes from changes since `master`, existing Unreleased content, PR context, and user input.
11. Present the exact changelog text and stop for user approval.

Exclude service-only agent infrastructure from user-facing notes unless requested, including `.agents/skills/`, `AGENTS.md`, agent-only `README.md` changes, `codex-skills.json`, `codex-skills.lock`, and `scripts/codex-skills.sh`. These files may still be included in the release PR.

## Completion Workflow After Approval

1. Commit version files and approved changelog on the release or hotfix branch.
2. Push and create a PR into `master`; build its main `Изменения` section from the approved changelog, keeping version/changelog mechanics in a technical or verification section.
3. Inspect `mergeable`, `reviewDecision`, `mergeStateStatus`, and `statusCheckRollup` before merging.
4. If the only block is branch protection or mandatory review and approval has already passed, use admin-bypass by default when authorized by current credentials. Report every bypass notice.
5. If conflicts exist, checks fail, or the block is unknown, stop; do not bypass.
6. Merge the PR, switch to `master`, pull the merged state, create `v{version}`, and push the tag.
7. Delete the merged `release-{version}` or `hotfix-{version}` branch locally and remotely. Delete only the branch used for this release.
8. If `preprod` exists, merge `master` into it and push; otherwise record that it was skipped.
9. Merge `master` into `develop` and push. Direct protected-branch bypass is the default only when available and required by this workflow; report notices or stop on a technical/permission rejection.
10. Verify the final remote/branch state and report high-signal results.

Do not create a sync PR by default. Do not ask for a second approval solely for `--admin` when the mandatory changelog gate passed and GitHub reports only covered protection/review policy blocks.

## Stop Conditions

Stop and report instead of guessing when:

- the requested source does not match a supported path;
- the version cannot be canonicalized confidently or conflicts with the branch name;
- local changes make checkout, pull, merge, or release edits unsafe;
- required version surfaces remain ambiguous after repository and overlay inspection;
- tests or review gates fail;
- changelog approval has not been given;
- the PR has conflicts, failing checks, or an unknown merge block;
- tag or follow-up sync would overwrite divergent state.

Preserve the prepared branch and exact failure evidence. Do not clean up a branch until its release PR is merged and tagged successfully.

## Command Skeletons

Release preparation:

```bash
git status --short
git switch develop
git pull
if make -n test >/dev/null 2>&1; then make test; fi
git switch -c release-4.12.0
git diff --name-only master...HEAD
# Run shared review-workflow plus discovered local review overlays.
# Update all locally defined version surfaces.
# Prepare CHANGELOG.md with changelog-workflow and stop for approval.
```

Start a hotfix only:

```bash
git status --short
git switch master
git pull
git switch -c hotfix-4.12.1
# Stop until the hotfix implementation is complete.
```

Do not treat `git merge-base`, merge, push, or GitHub command failures as interchangeable; inspect the actual reason before continuing.

## PR And Merge Contract

- Base is always `master`.
- Head is the prepared `release-{version}` or existing `hotfix-{version}`.
- Changed files are reviewed relative to `master` with shared and discovered overlay rules.
- Approved changelog content drives the PR's user-facing summary.
- Admin-bypass applies only to known branch-protection or mandatory-review blocks after changelog approval; it never overrides conflicts or failing checks.

## Completion Criteria

The release is complete only when:

- the canonical version is reflected in every applicable version surface and changelog;
- supported tests and overlay-aware review passed;
- the approved release PR is merged into `master`;
- merged `master` is tagged `v{version}` and the tag is pushed;
- the used release/hotfix branch is deleted locally and remotely;
- `preprod` was synced when present and `develop` was synced;
- the final report includes source branch, PR URL, merge commit or old..new range, tag, tests/review, cleanup, sync results, skipped branches, and bypass notices.

Keep that report concise: summarize pull/merge output rather than pasting long diffs, but name any unresolved blocker and the last safely completed stage.
