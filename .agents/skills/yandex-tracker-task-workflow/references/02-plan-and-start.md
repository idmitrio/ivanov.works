# Phase 2: Plan And Start

## Prepare And Confirm The Plan

When the task is clear, prepare a staged implementation plan that follows Agent Workflow Rules.

Implementation stages should be coherent future commit boundaries. Keep each stage narrow enough that the expected implementation, local investigation, focused verification, and Tracker state update should fit within roughly 40% of a 250,000-token context window, or about 100,000 tokens. Split larger logical chunks into smaller sequential stages with clear acceptance points. Verification, self-review, `php -l`, main tests, and final diff review are workflow gates or verification-only checklist items; do not force a separate commit for them unless they produce file changes. The main test command, such as `make test`, belongs to review-gate by default.

When planning PHPUnit-focused checks, avoid writing a raw command that bypasses the project's test environment. If `make test` or another main wrapper exists, inspect how it invokes PHPUnit and plan narrowed commands that preserve the wrapper's environment, config, bootstrap, and options. Each command invocation must target exactly one changed test file or one closest relevant test file. If several test files need coverage, plan a separate wrapper invocation for each file; never combine multiple test file paths in one `make test` or equivalent wrapper command. The full main wrapper still belongs to the review-gate.

In the plan comment, list each stage with the concrete work and expected files/directories. Do not repeat standard verification rules or likely test commands in the plan unless the task has unusual verification constraints not already covered by this skill.

After the staged plan, add a separate list of files expected to be touched. For each file, include one short sentence explaining what will change in that file. If the exact file list is not fully known yet, list the expected directories or likely files and mark them as preliminary.

Add the plan and expected touched files to Tracker as the first normal workflow comment, then print the same message in the console. Use the compact plan template from [comment-templates.md](comment-templates.md).

Stop and wait for explicit confirmation before implementation.

## Stage Approval Mode

After confirmation, classify the user's permission before changing files:

- `stage-by-stage` is the default. Words such as "приступай", "начинай", "делай", "ок", or "go" mean start the first stage only.
- `batch-until-gate` is allowed only when the user explicitly asks to execute several or all confirmed stages without intermediate approvals, for example "делай все этапы без остановок до review" or "реализуй все пункты и потом покажи".

Record the selected mode in working context. If the wording is ambiguous, use `stage-by-stage`.

In `stage-by-stage`, accepting a completed stage does not approve starting the next stage. After the accepted stage is committed, checklist-completed, and reflected in `Codex State`, stop and ask whether to start the next plan item.

In `batch-until-gate`, continue only up to the next workflow gate, such as testing, PR creation, destructive action, deploy, merge, unclear requirements, or final acceptance before commits when commit permission was not explicit.

Batch permission does not override repository rules that require explicit confirmation for destructive commands, dependency updates, migration execution or rollback, deploy actions, public API/auth/payment/order/integration/admin-panel behavior changes, or commits when the user has not approved committing completed work.

## Start Implementation After Confirmation

After confirmation:

1. Move the issue to `В работе`.
2. Assign the issue to the current user. If the current Tracker user id is unknown, get it from the current assignee, `my-issues`, or ask the user.
3. Create the Tracker checklist from user-visible implementation items and verification gates. Use `set-checklist` from [commands.md](commands.md).
4. Create a branch using [git-branch-workflow](../../git-branch-workflow/SKILL.md):
   - task -> `feature/<issue-key-or-summary-slug>`;
   - bug -> `fix/<issue-key-or-summary-slug>`.
5. Create the single editable `Codex State` Tracker comment using [comment-templates.md](comment-templates.md). It should say the issue is in work, name the current stage, summarize completed items as `none`, and name the next expected action.

Prefer including the issue key in the branch slug, for example `feature/<issue-key>-order-export`.

## Checklist Semantics

- Checklist items should reflect implementation stages and meaningful verification gates, not workflow mechanics.
- Mark implementation items complete only after the user accepts the stage and the accepted commit exists.
- Mark verification or review items complete only after the mandatory review-gate passes in Tracker status `Ревью`.
- Do not add PR creation, branch creation, or status transitions to the checklist when they are only workflow mechanics.

If the user adds a new implementation scope item after confirming the plan, first record the concise scope change in `Codex State`, then update the checklist while preserving completed items, execute the new item as its own stage and commit boundary, and continue the original workflow. If the new item is verification-only, close it through `Codex State` without a commit hash.
