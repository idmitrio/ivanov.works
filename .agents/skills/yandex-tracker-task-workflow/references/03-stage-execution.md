# Phase 3: Stage Execution

For each plan item:

1. Implement only that item.
2. Run focused verification appropriate to the touched code.
3. Self-review for mistakes, regressions, maintainability risks, and scope drift.
4. Stop and ask the user to review and accept the stage.
5. After explicit acceptance, create a commit using [commit-workflow](../../commit-workflow/SKILL.md) when the item changed files.
6. Mark the matching Tracker checklist item complete.
7. Update the existing `Codex State` comment with the accepted stage result, commit hash when present, focused verification summary, and next step.
8. In `stage-by-stage` mode, stop and ask for explicit permission before starting the next implementation item.

For PHPUnit-focused verification, do not invent a bare `vendor/bin/phpunit` command when the project has a supported main test wrapper such as `make test`. First inspect how the wrapper runs tests, for example with `make -n test`, `Makefile`, `composer.json`, or related scripts. Reuse the same environment, bootstrap, configuration, and options. Each narrowed wrapper invocation must target exactly one relevant changed test file or one closest existing test file for the touched code. If several test files need to run, invoke the wrapper separately for each file; never combine multiple test file paths in one `make test` or equivalent wrapper command. Run the whole main project test command only in the review-gate unless the user explicitly asks otherwise.

After acceptance, do not add a new Tracker comment that only says the stage was accepted, committed, or checklist-completed. Checklist completion records acceptance, and the git commit records the committed state. Prohibited examples include `Этап N принят`, `Этап N принят и закоммичен`, and `Пункт N принят, коммит <hash>`.

Use `Codex State`, not a new comment, for substantive stage results. It must describe the actual implementation or verification result, not the acceptance event. For verification-only items that did not change files, include the check result and state that no separate commit was created.

In `stage-by-stage` mode, stop after step 4 until the user explicitly accepts the current stage. After steps 5-7 finish, stop again; the user's acceptance of the completed stage is not permission to start the next implementation item.

If the user explicitly allowed several confirmed plan items to be completed without intermediate approval stops, execute those items as one continuous implementation batch. Keep scope limited to the accepted plan, run verification and self-review, then stop for acceptance before commits unless the user also explicitly approved committing. When commits are approved, use one or more focused commits that match coherent change boundaries. Still stop at the next workflow gate that requires a separate decision.

Even in batch mode, stop before migrations, migration execution or rollback, dependency updates, deploy actions, destructive commands, and high-risk behavior changes in public API, auth, payment, wallet, order, integration, admin-panel, domain, certificate, or operation flows unless the user explicitly approved that class of action.

If the user gives a remark or correction in chat during a stage, first summarize the actionable feedback in `Codex State`, then make the fix. After the fix, update the same `Codex State` comment with what changed, verification performed, and the commit hash. If the user only accepts the stage without new requirements, do not add an external feedback comment or acceptance comment; commit the accepted work, complete the checklist item, and update `Codex State`.

If the user reports a workflow violation or rejects the implementation direction, record the actionable feedback in `Codex State`, correct the workflow or implementation, and stop for acceptance before continuing. Preserve exact feedback text only when the wording itself affects implementation or audit value.

Use `checklist-complete` or `checklist-uncomplete` instead of manually patching `checklistItems`. The helper reads the current checklist, preserves other items, writes the updated state, and verifies progress. Do not use saved checklist item ids as stable identifiers.

Do not mark verification-gate checklist items complete during stage execution. Mark them only after the review-gate passes, using [04-review-gate.md](04-review-gate.md).

If one commit completes multiple items, identify them in `Codex State`. For non-adjacent items, list them explicitly, for example `Выполнены пункты плана 1, 3 и 4`.
