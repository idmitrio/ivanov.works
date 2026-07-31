---
name: ivanov-works-release-workflow
description: Publish Ivanov Works releases and hotfixes end to end, including versioning, changelog, merge, tag, branch synchronization, and production Docker deployment. Use when the user requests a release, hotfix release, version publication, or production rollout for Ivanov Works.
---

# Ivanov Works Release Workflow

## Operating Mode

Treat a release request as authorization to complete the entire workflow without confirmation stops. Do not run `review-workflow`, request changelog approval, ask permission to commit, ask permission to merge, or ask permission to deploy.

Stop only on a real technical safety blocker: a dirty worktree not created by the current release, merge conflicts, failing required commands or checks, an existing conflicting tag, authentication failure, a divergent protected branch, or a production health failure. Report the exact blocker and preserve the last safe state; do not ask routine process questions.

## Release Preparation

1. Canonicalize the requested version as `X.Y.Z`; remove a leading `v` and convert `X.Y` to `X.Y.0`.
2. Require a clean worktree. Fetch origin and confirm that `vX.Y.Z` and `release-X.Y.Z` do not already exist locally or remotely.
3. Switch to `develop`, pull it with `--ff-only`, and create `release-X.Y.Z`.
4. Run the project gates:

   ```bash
   npm run lint
   npm run build
   docker compose config --quiet
   ```

   Treat lint warnings separately from errors. The project has no automated test script; never describe lint or build as tests.
5. Update `package.json` and both root-version fields in `package-lock.json`.
6. Add a concise Russian `CHANGELOG.md` entry using the existing format, current date, and user-facing changes since `master`. Exclude agent infrastructure unless it materially changes production operation.
7. Confirm version consistency and `git diff --check`, then commit all release preparation files as:

   ```text
   chore(release): prepare X.Y.Z
   ```

## Publish And Merge

1. Push `release-X.Y.Z` and create a non-draft PR into `master`. Build the PR summary from the changelog and list the executed gates.
2. Inspect GitHub mergeability and required status checks. Do not perform a code review. Merge immediately when there are no conflicts or failing checks; use authorized admin bypass only for branch-protection or review-policy gates.
3. Switch to `master`, pull with `--ff-only`, create annotated tag `vX.Y.Z`, and push it.
4. Delete only `release-X.Y.Z` locally and remotely after the merge succeeds.
5. If `preprod` exists, merge `master` into it and push. Then merge `master` into `develop` and push. Never force-push or rewrite history.

## Production Deployment

Resolve the immutable release commit and run the deployment helper immediately after Git publication and branch synchronization:

```bash
release_commit="$(git rev-parse "vX.Y.Z^{commit}")"
./.agents/skills/ivanov-works-release-workflow/scripts/deploy-production.sh "$release_commit"
```

The helper connects to `root@155.212.162.160`, requires a clean `master` checkout in `/opt/ivanov.works`, verifies that `origin/master` equals the tagged release commit, pulls with `--ff-only`, validates Compose, rebuilds the containers, waits for the application healthcheck, verifies Caddy, and checks `https://ivanov.works/`.

Never print or replace the server-side `.env`, delete Docker volumes, force-reset the server repository, or bypass a failed healthcheck. If deployment fails, keep the Git release intact and report it as published but not successfully deployed.

## Completion Report

Report only high-signal results:

- release version and PR URL;
- merge commit and tag;
- lint errors/warnings, build, Compose validation, and GitHub checks;
- release-branch cleanup and `develop`/`preprod` synchronization;
- production commit, app health, Caddy state, and HTTPS result;
- any admin bypass or skipped optional branch.

The workflow is complete only when the tagged `master` commit is running successfully in production.
