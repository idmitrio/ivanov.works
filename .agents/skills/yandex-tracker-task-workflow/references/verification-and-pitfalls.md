# Yandex Tracker Task Workflow Verification And Pitfalls

## Verification

Before considering the workflow step complete, verify:

- Tracker status changed to the intended status.
- Tracker comments follow the compact model: plan comment, one editable `Codex State`, and final support comment. Plain stage acceptance, commit creation, review readiness, PR creation, and routine verification were recorded through checklist/git/`Codex State`, not separate comments.
- Attached text files were included in readiness analysis, or non-text attachments were explicitly treated as metadata-only.
- Checklist exists before implementation starts.
- A single `Codex State` comment exists after implementation starts and was edited in place for intermediate progress.
- Completed checklist items reflect committed stages.
- Each commit is focused and follows Conventional Commits.
- The main project test command result or gap is documented in the PR body and final Tracker comment.
- The mandatory review-gate ran in Tracker status `Ревью` before PR creation.
- Verification or review checklist items are completed only after the review-gate passes.
- PR targets `develop`.
- PR title uses `<ISSUE-KEY> <short human summary>`, not a Conventional Commit title.
- PR body is short, uses real line breaks, and includes the test command result or gap.
- After PR creation and every later push, the branch head, `refs/pull/<PR>/head`, and `gh pr view <PR> --json headRefOid` all point to the intended latest commit.
- If the PR/testing phase found a defect or the PR was rejected, the issue was moved back to `Ревью` or `В работе`, the fix was committed, and the flow returned through review before final acceptance.
- If the PR was merged, `gh pr view <PR> --json state,mergedAt,mergeCommit` was checked and the merge commit was recorded in Tracker before moving to `Готово к релизу`.
- The final Tracker status is `Тестируется` after PR creation, or `Готово к релизу` only after successful acceptance/testing. The issue is not closed.

## Smoke-Flow Rollback

For smoke-flow rollback, verify the issue returns to the captured baseline:

- status is back to the original status, usually `Беклог`;
- assignee and resolution match the original values;
- smoke comments are deleted;
- checklist is empty and verified by read-back;
- followers are restored or removed if the workflow added the current user;
- local smoke branch is deleted and `git status --short` is clean.

## Known Pitfalls

- Tracker status display names and status keys can differ. Always read transitions when a status key is unknown.
- Linked issues can change the true scope; do not rely only on the main issue description.
- `set-checklist` replaces the whole checklist and creates unchecked items. Do not use it to mark one item done after work has started unless you intentionally rebuild the full checklist state.
- Use `checklist-complete` or `checklist-uncomplete` for routine progress updates. Manual `checklistItems` patches can recreate item ids and are easier to get wrong.
- When updating or replacing a checklist after work has started, preserve checked state for all existing completed items and re-read the issue afterward.
- `clear-checklist` must be verified by reading the issue back. If the checklist is still present, patch `{"checklistItems":[]}` and verify again.
- Tracker may add the current user to followers during issue updates. Remove smoke-run followers with `{"followers":{"remove":["<user-id>"]}}`.
- Do not create commits just because a checklist item is implemented. A commit requires explicit user acceptance under Agent Workflow Rules.
- Do not create commits for verification-only checklist items that did not change files. Close them through `Codex State` without a commit hash.
- After resuming an interrupted session, do not run the main project test command during state reconstruction or ordinary stage execution. Run it only inside the review-gate after all implementation items are accepted and committed.
- If tests fail because of code, fix the failure before creating the PR. If tests cannot run because infrastructure is unavailable, document that blocker clearly in the PR body, Tracker, and final user message before asking for confirmation or continuing a smoke dry run.
- Do not move a rejected PR or post-PR defect directly to `Готово к релизу`; return the issue to `Ревью` or `В работе`, fix it, repeat review-gate, update the PR, and repeat user testing.
- A PR can occasionally have a stale head even after the source branch ref was pushed. If `refs/heads/<branch>` points to the new commit but `refs/pull/<PR>/head` or `gh pr view --json headRefOid` still points to an older commit after a repeat push, close the stale PR with a comment, create a replacement PR from the same branch, verify the replacement PR head, and update `Codex State` with the new URL.
- Do not use shell-escaped `\n` for multiline Tracker comments or PR bodies. Use real line breaks through stdin, text files, or quoted multiline command arguments that have been verified in the API response.
