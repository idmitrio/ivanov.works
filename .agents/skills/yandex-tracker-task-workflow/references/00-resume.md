# Phase 0: Resume After Interruption

Use this phase whenever a Tracker task is resumed after a session interruption, compaction, model restart, or unclear previous progress.

The goal is to reconstruct the workflow boundary before doing work. Do not rely on memory from the earlier session.

## Reconstruct State

1. Read the Tracker issue fields, links, checklist, plan comment, and latest `Codex State` using [commands.md](commands.md). Do not load the full comment history when `Codex State`, checklist, and git state are enough to reconstruct the workflow boundary.
2. Inspect git state:
   - current branch;
   - `git status --short`;
   - commits on the branch compared with the target branch;
   - changed files compared with the target branch.
3. Map each accepted plan item to evidence:
   - `Codex State` progress summary;
   - matching commit hash for implementation items;
   - completed checklist item;
   - focused verification noted in `Codex State` when present.
4. Treat a plan item as complete only when the implementation was accepted, the commit exists for file-changing work, and the checklist item is complete.
5. Treat uncommitted local changes as an in-progress stage unless Tracker and git clearly prove they are unrelated to the task.

If `Codex State` is missing, stale, or contradicts git/checklist evidence, read only the additional comments needed to reconstruct the current boundary, then create or update the single `Codex State` comment before continuing. Use full comment history only as a fallback for contradictions or missing state.

## Choose The Next Phase

- If requirements, plan, or user confirmation are missing, return to [01-readiness.md](01-readiness.md) or [02-plan-and-start.md](02-plan-and-start.md).
- If there are uncommitted task changes, continue the current stage in [03-stage-execution.md](03-stage-execution.md): run only focused verification appropriate to those touched files, self-review, then stop for user acceptance before committing.
- If some implementation checklist items are incomplete, continue with the first incomplete implementation item in [03-stage-execution.md](03-stage-execution.md).
- If all implementation items are accepted, committed, and reflected in the checklist, then and only then enter [04-review-gate.md](04-review-gate.md).
- If review-gate has already passed for the latest commit and the result is documented, continue with migration or PR handoff as appropriate.
- If a PR already exists, resume from [06-pr-handoff.md](06-pr-handoff.md) or [07-fixes-after-pr.md](07-fixes-after-pr.md) based on Tracker status, PR state, and user feedback.

## Test Gating After Resume

Do not run the main project test command, such as `make test`, during resume reconstruction.

The main project test command belongs only to the mandatory review-gate. After resume, run it only when all of these are true:

- every implementation plan item is accepted and committed;
- there are no uncommitted task changes;
- the Tracker issue is being moved to or is already in `Ревью`;
- the latest branch commit has not already been covered by a documented review-gate result;
- the user has not explicitly asked to skip the main test command for this gate.

During stage execution after resume, run only focused checks for the touched code. For PHPUnit checks, inspect the project's main test wrapper when available, such as `make -n test`, and reuse the same PHPUnit environment/config/options. Narrow each wrapper invocation to exactly one changed or nearest relevant test file. If several test files need coverage, invoke the wrapper separately for each file; do not pass multiple test file paths in one `make test` or equivalent wrapper command. If no code changed since the last accepted commit, do not run tests merely to "catch up"; instead document the reconstructed state and continue from the next workflow boundary.
