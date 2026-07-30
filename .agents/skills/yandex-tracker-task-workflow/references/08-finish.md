# Phase 8: Finish

After the user confirms correct behavior in `Тестируется`:

1. Move the issue to `Готово к релизу` only when the workflow explicitly reaches successful acceptance or testing.
2. Do not use `Готово к релизу` as a synonym for "PR created".
3. If a PR was created, check PR state:

```bash
gh pr view <PR> --json state,mergedAt,mergeCommit,mergedBy,reviewDecision,mergeStateStatus,statusCheckRollup
```

4. If the PR was merged, require `state: MERGED`, record `mergedAt`, `mergedBy`, and merge commit in Tracker, then move to `Готово к релизу`.
5. If the PR was not merged and GitHub reports required review, blocked merge state, failing checks, or another merge blocker, record that in `Codex State` and the final response. Do not merge or bypass branch protections unless the user explicitly asks and repository-local rules allow it.
6. Add a final Tracker comment summarizing the result, linking the PR URL, listing commits, listing verification, and noting any remaining PR-side blockers or the merge commit.
7. Send the user a final message that explicitly states:
   - the workflow is complete;
   - final Tracker status;
   - PR URL, if a PR was created;
   - commits made;
   - short summary of what changed;
   - checks performed and test gaps;
   - that Tracker was updated with the plan comment, `Codex State`, final comment, checklist, and status changes.

If a defect is found after PR creation, or the PR is rejected or returned with required fixes, switch to [07-fixes-after-pr.md](07-fixes-after-pr.md).

For smoke tests or explicit dry runs, do not push the branch and do not create a GitHub PR. Verify the intended PR command locally, update `Codex State` to say PR creation was dry-run only, and include the command that would have been used.

Use the final Tracker comment template from [comment-templates.md](comment-templates.md). If `make test` or another main project test command exists and passes, record `<command>: passed`. If the command exists but fails because infrastructure is unavailable, write the concrete infrastructure blocker. If unsupported or cannot run, include that gap in both PR body and final Tracker comment.

The flow ends here. Do not close the Tracker issue.
