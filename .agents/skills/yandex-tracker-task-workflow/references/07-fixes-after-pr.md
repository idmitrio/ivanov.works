# Phase 7: Fixes After PR

Use this phase when review or testing feedback arrives after a PR exists but before the issue is accepted.

## Testing Finds Problems

1. Record the actionable testing feedback in `Codex State`.
2. Fix the problem.
3. Run focused checks and self-review. Do not run the main test command here by default; it belongs to the repeated review-gate after the fix is committed.
4. Commit the fix with [commit-workflow](../../commit-workflow/SKILL.md).
5. Update `Codex State` with the fix and focused verification.
6. Return to `Ревью`, repeat review-gate, migration gate, and PR update flow, then move back to `Тестируется`.

## Review Or Testing Feedback After PR

1. Record the actionable feedback in `Codex State` before changing code.
2. Move the issue back to `Ревью` when implementation remains generally complete, or `В работе` when the plan or scope needs more implementation.
3. Make the smallest scoped fix.
4. Run focused checks and self-review. Do not run the main test command here by default; it belongs to the repeated review-gate after the fix is committed.
5. Ask for user acceptance when required by Agent Workflow Rules.
6. Commit the fix separately after acceptance.
7. Push the branch.
8. Verify the PR head after the push using [06-pr-handoff.md](06-pr-handoff.md).
9. Update `Codex State` with fix, verification, commit hash, and PR URL.
10. Repeat review-gate when the fix affects behavior, contracts, migrations, public API, auth, payments, permissions, UI, or other meaningful risk. Then move the issue back to `Тестируется`.

Do not move a rejected PR or defect directly to `Готово к релизу`.
