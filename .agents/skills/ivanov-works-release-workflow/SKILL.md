---
name: ivanov-works-release-workflow
description: Release or hotfix Ivanov Works with the shared release workflow, then deploy the released master commit to the production Docker host. Use when preparing an Ivanov Works release, hotfix release, version publication, or production rollout.
---

# Ivanov Works Release Workflow

## Base Workflow

Read and follow the managed [release-workflow](../release-workflow/SKILL.md) in full. Preserve every branch, review, changelog-approval, PR, merge, tag, cleanup, and synchronization gate from that workflow.

Treat this overlay as already applied when the base workflow performs overlay discovery; do not load it recursively. Do not deploy a newly created hotfix branch: deploy only after the base workflow has completed an approved release or hotfix release.

## Production Deployment

After all base-workflow completion criteria pass, deploy automatically without requesting another approval:

1. Resolve the immutable release commit from the tag:

   ```bash
   release_commit="$(git rev-parse "v${version}^{commit}")"
   ```

2. Run the project deployment helper with that commit:

   ```bash
   ./.agents/skills/ivanov-works-release-workflow/scripts/deploy-production.sh "$release_commit"
   ```

3. Report the deployed commit, application health, Caddy state, and public HTTPS check together with the base release report.

The helper connects to `root@155.212.162.160`, updates `/opt/ivanov.works` from `origin/master` with a fast-forward-only pull, validates Compose, rebuilds the containers, waits for the application healthcheck, and verifies `https://ivanov.works/`.

## Safety Contract

- Require the remote worktree to be clean and checked out on `master` before pulling.
- Require `origin/master` to equal the release-tag commit. Stop instead of deploying a different commit.
- Preserve the server-side `.env` and Caddy volumes; never print secrets or replace production configuration.
- Never force-pull, reset, delete containers or volumes, or bypass a failed Docker healthcheck.
- If deployment fails, preserve the completed Git release, collect concise Compose status/log evidence, and report the release as published but not successfully deployed.

## Completion Criteria

The release is complete only when both the managed base workflow and the production deployment succeed. The final report must include the production commit and verification result in addition to the base workflow's required release details.
