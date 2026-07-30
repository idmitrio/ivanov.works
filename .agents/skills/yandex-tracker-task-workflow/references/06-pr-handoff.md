# Phase 6: PR Handoff

When review-gate passes, migration gate is complete, and automated test result or gap is documented:

1. Continue the PR workflow using [develop-pr-workflow](../../develop-pr-workflow/SKILL.md) and create the PR into `develop`.
2. Treat the PR as the review, CI, and testing artifact. It must exist before the issue moves to `Тестируется`.
3. Do not split the completed Tracker `Ревью` gate into a separate "pre-PR review". If files changed afterward, including migration consolidation changes, keep the issue in `Ревью`, rerun review-gate on affected files, and only then create or update the PR.
4. Use a task-style PR title, not a Conventional Commit title. Prefer `<ISSUE-KEY> <short human summary>`, for example `SF-782 Новый способ авторизации iikoCloud`.
5. Keep the PR body short and readable. Use real line breaks, a compact summary, and a short verification block. Do not put the whole stage history or long Tracker-style prose into the PR body.
6. Include the review-gate test command result or accepted gap in the PR body:
   - If the command is supported and passed, write `<command>: passed`.
   - If the command is unsupported, could not run, or was skipped by explicit user direction, write the exact gap and reason.
7. If `gh pr create` fails with a 5xx error, timeout, or network error, do not blindly retry creation:
   - First check whether the PR already exists, for example with `gh pr view <branch>` or `gh pr list --head <branch> --base <target>`.
   - Retry `gh pr create` only when the PR is confirmed absent.
   - If retry or existence check needs escalated permissions because of network sandbox failure, use current Codex escalation rules.
8. Do not rerun the main test command or [review-workflow](../../review-workflow/SKILL.md) in this phase when the latest commit was already covered by the completed review-gate. If new commits appear after review-gate, go back to `Ревью` and repeat review-gate first.
9. If the PR workflow rejects the change or returns required fixes, keep the issue in `Ревью`, fix the problem, commit after user acceptance, repeat review-gate, and then continue PR creation or update.

## PR Head Verification

After creating or updating the PR and after every later push to its head branch, verify that GitHub sees the intended head commit:

```bash
git ls-remote origin refs/heads/<branch>
git ls-remote origin refs/pull/<PR>/head
gh pr view <PR> --json headRefOid,commits
```

Confirm all relevant values include the latest intended commit.

If the branch ref contains the intended commit but `refs/pull/<PR>/head` or `headRefOid` stays on an older commit after a repeat push, treat the PR as having a stale head:

1. Close the stale PR with a comment that names the stale SHA and branch SHA.
2. Create a new PR from the same branch.
3. Verify the new PR head with the checks above.
4. Update `Codex State` with the replacement PR URL and the stale PR reason.

## Move To Testing

After the PR URL is known and its head is verified:

1. Move the issue to `Тестируется`.
2. Update `Codex State` with PR URL, review result, commits, and verification. Include the same test command result or gap that appears in the PR body.
3. Print a concise summary of completed work, PR URL, and verification.
4. Wait for confirmation that the task works correctly.

If the task is in `Тестируется` and the user clearly confirms the result with words such as `принято`, `ок`, `подходит`, or `работает`, continue without asking the same question again: move the issue to `Готово к релизу` and add the final Tracker comment.

Use PR body templates from [comment-templates.md](comment-templates.md).
