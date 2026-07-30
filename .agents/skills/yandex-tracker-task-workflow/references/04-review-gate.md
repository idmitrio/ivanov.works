# Phase 4: Review Gate

After all plan items are implemented and committed:

1. Move the issue to `Ревью`.
2. Update `Codex State` to show that implementation is ready for review and list the latest committed stage/hash range.
3. Check changed files for the branch, usually with `git diff --name-only <target>...HEAD`.
4. Run the mandatory review-gate with [review-workflow](../../review-workflow/SKILL.md) on changed files. If the project has a local overlay for [review-workflow](../../review-workflow/SKILL.md), apply it too.
5. Review the full diff against the Tracker task, linked tasks, comments, and accepted plan.
6. Check whether the current project supports its main test command, for example `make test` checked with `make -n test`.
7. If the main test command is supported, run it as automated verification during this review-gate. This is the only workflow phase where the main test command is required by default.
8. If the command passes, record `<command>: passed`.
9. If the command is not supported or cannot run, record the exact gap for the PR body and Tracker.
10. If the command fails because local infrastructure is unavailable, record the infrastructure failure instead of treating it as a code defect.
11. If the user explicitly says not to run the main test command for this gate, do not run it; record the user-directed test gap in Tracker and PR notes. Focused checks and review still remain required.

If review finds blocking defects, keep the issue in `Ревью` and do not create a PR yet:

1. Record the finding in working context and in `Codex State` when it affects task state.
2. Fix the defect with a scoped change.
3. Run focused checks.
4. Ask for user acceptance before committing.
5. Commit the fix separately using [commit-workflow](../../commit-workflow/SKILL.md), usually with `fix(...)`.
6. Update `Codex State` with finding, fix, verification, and commit hash.
7. Repeat review-gate on affected changed files before PR creation.

Repeat review and testing until no blocking code problems remain. Mark verification or review checklist items complete when they exist. A verification-gate checklist item can be completed after review-gate passes even when the main test command has a documented accepted gap.

Use the `Codex State` template from [comment-templates.md](comment-templates.md) for review readiness, review findings, and review fixes.
