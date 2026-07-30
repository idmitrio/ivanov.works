---
name: yandex-tracker-task-workflow
description: Execute repository development tasks that start from a Yandex Tracker issue, including issue analysis, clarification, planning, branch creation, staged commits, review, testing, PR creation, and Tracker status/comment/checklist updates. Use when Codex needs to work from a Tracker issue through implementation and project status updates.
---

# Yandex Tracker Task Workflow

## Overview

Use this skill when work must be performed from a Yandex Tracker issue in the configured Tracker queue.

This skill is an orchestrator. Load only the reference file for the current workflow phase, plus [references/commands.md](references/commands.md) when running Tracker helper commands and [references/comment-templates.md](references/comment-templates.md) when writing Tracker comments or PR bodies.

## Recommended Reasoning

Default: `high`

Use `high` for normal Tracker-driven development because this workflow combines issue analysis, clarification, staged planning, implementation, Tracker writes, branch handling, commits, review, tests, and PR handoff. Use `xhigh` when the issue is underspecified, spans multiple stages, includes migrations or external API side effects, involves production-sensitive behavior, or requires long work from analysis through PR.

## Related Skills

Use these shared skills during the workflow:

- [yandex-tracker-api](../yandex-tracker-api/SKILL.md) for all Tracker API operations.
- [git-branch-workflow](../git-branch-workflow/SKILL.md) before implementation starts.
- [commit-workflow](../commit-workflow/SKILL.md) after each accepted plan item or defect fix.
- [review-workflow](../review-workflow/SKILL.md) as the mandatory Tracker `Ревью` gate before PR creation.
- [sf-migration-workflow](../sf-migration-workflow/SKILL.md) when the branch adds or changes files under `migrations/`.
- [sf-settings-workflow](../sf-settings-workflow/SKILL.md) when the branch includes settings seed migrations named `migrations/*seed_settings_table.php`.
- [develop-pr-workflow](../develop-pr-workflow/SKILL.md) after the mandatory review-gate passes.

## Capabilities

- Read and validate Tracker issue context before implementation.
- Clarify underspecified issues and stop when product behavior or branch type is ambiguous.
- Prepare staged implementation plans with explicit user confirmation.
- Coordinate branch creation, implementation stages, focused commits, review, tests, PR handoff, and final Tracker updates.
- Keep Tracker comments, checklist, status transitions, and PR metadata aligned with repository work.
- Resume interrupted work by reconstructing Tracker and git state before continuing.

## Core Rules

- Start only when a Tracker issue key is known. If the user provides only a number, derive the issue key from `YANDEX_TRACKER_QUEUE`, or use `SF`.
- Do not implement underspecified work. Move unclear issues to `Требуется информация`, add concrete questions, and stop.
- Prepare a staged plan and wait for explicit confirmation before implementation.
- Treat implementation stages as future commit boundaries. Commit only after explicit user acceptance.
- By default, confirmation words such as "приступай", "начинай", "делай", "ок", or "go" approve starting the first stage only. Do not infer permission to run all stages as a batch unless the user explicitly says to skip intermediate approvals.
- In `stage-by-stage` mode, stage acceptance approves only the accepted stage wrap-up: commit, checklist completion, and `Codex State` update. After that, stop and ask for explicit permission before starting the next stage.
- After an interrupted or resumed session, rebuild the workflow state from Tracker and git before acting. Do not run the main project test command, review-gate, PR flow, or final status transition just because some plan items are complete; continue only from the first unambiguous incomplete gate.
- Keep implementation batching, commits, destructive actions, migrations, deploys, and high-risk product behavior changes as separate permissions.
- Record external user feedback and review feedback in Tracker before acting on it when it arrived outside Tracker. Use the editable `Codex State` comment for this unless a separate clarification comment is required. Do not add a separate Tracker comment for plain stage acceptance; the completed checklist item is the acceptance record.
- Keep Tracker writes for one issue sequential; do not run status changes, checklist writes, and comments in parallel for the same issue.
- Use real line breaks for multiline Tracker comments and PR bodies. Prefer interactive `add-comment --stdin`: start the helper, send text through stdin, then send EOF (`\u0004`) separately. Use `--text-file` when interactive stdin is not practical; inline comment text is only for one-line comments.
- Keep Tracker history useful and compact: for a ready task, use one plan comment, one editable `Codex State` comment for all intermediate progress, and one final support-oriented result comment. Do not add comments that only restate acceptance, commit creation, checklist completion, review readiness, PR creation, or routine verification.
- Create the PR before moving the issue to `Тестируется`.
- Do not close the Tracker issue. Move to `Готово к релизу` only after successful acceptance/testing or verified merge, according to the project flow.

## Tracker Comment Model

For a normal ready task, keep the comment thread to three durable comments:

1. Plan comment: the first workflow comment after readiness. It may be moderately detailed, but should list what will be done and the expected files/directories, not repeat standard verification rules from this skill.
2. `Codex State` comment: create once after the plan is confirmed, then edit in place for stage results, feedback summaries, review-gate result, migration gate, PR URL, checks, blockers, and next step. Keep it short and current; do not append a chronological log.
3. Final Tracker comment: keep the support/helpdesk-oriented final comment from [references/comment-templates.md](references/comment-templates.md).

Clarification before a task is ready is an allowed extra comment. Long external feedback should be summarized in `Codex State` with only the actionable scope change, decision, or blocker; preserve the full text only when the exact wording is needed for audit or implementation.

## Status And Type Rules

Use Tracker transitions from the issue itself instead of hardcoding transition ids. If a status key is unknown, read available transitions and choose the transition whose target display name matches:

- `Требуется информация`
- `В работе`
- `Ревью`
- `Тестируется`
- `Готово к релизу`

Branch type is derived from issue type:

- `Задача` / `task` -> `feature/<slug>`
- `Ошибка` / `bug` -> `fix/<slug>`

If the issue type is neither task nor bug, stop and ask which branch type to use.

## Phase Map

Read each phase reference only when entering that phase:

| If you are at this phase | Read this reference | Covers |
| --- | --- | --- |
| Resuming after a session interruption or unclear previous progress | [references/00-resume.md](references/00-resume.md) | Tracker/git state reconstruction, next-phase selection, test gating |
| Getting or validating the issue key; reading Tracker context; deciding whether the task is ready | [references/01-readiness.md](references/01-readiness.md) | Issue key, Tracker context, comments, links, attachments, readiness |
| Preparing the plan or starting confirmed work | [references/02-plan-and-start.md](references/02-plan-and-start.md) | Staged plan, confirmation, `В работе`, assignee, checklist, branch |
| Implementing accepted plan stages | [references/03-stage-execution.md](references/03-stage-execution.md) | Implementation stages, focused checks, acceptance, commits, checklist, feedback comments |
| All implementation stages are committed and the branch needs pre-PR review | [references/04-review-gate.md](references/04-review-gate.md) | Tracker `Ревью`, [review-workflow](../review-workflow/SKILL.md), main tests, blocking findings |
| The branch has migration changes or needs migration consistency checked before PR | [references/05-migration-gate.md](references/05-migration-gate.md) | Pre-PR migration and settings seed consolidation |
| Creating or updating the PR and moving the issue to testing | [references/06-pr-handoff.md](references/06-pr-handoff.md) | PR title/body, PR creation, PR head verification, stale PR fallback, `Тестируется` |
| Feedback arrives after a PR exists but before final acceptance | [references/07-fixes-after-pr.md](references/07-fixes-after-pr.md) | Post-PR review/testing feedback, fixes, PR update, repeated gates |
| The user accepts testing or reports the PR was merged | [references/08-finish.md](references/08-finish.md) | Acceptance, merge verification, `Готово к релизу`, final comment and response |

Support references:

- [references/commands.md](references/commands.md) - common Tracker helper commands.
- [references/comment-templates.md](references/comment-templates.md) - Tracker comments and PR body templates.
- [references/verification-and-pitfalls.md](references/verification-and-pitfalls.md) - final verification checklist, smoke rollback, and known pitfalls.

## Configuration

Tracker credentials are managed by [yandex-tracker-api](../yandex-tracker-api/SKILL.md):

- `YANDEX_TRACKER_TOKEN` is the OAuth token.
- `YANDEX_TRACKER_ORG` is the organization id.
- `YANDEX_TRACKER_QUEUE` is the default queue key. If it is not set, use `SF`.
- Shell environment has priority over repository-local `.env`.

Do not ask the user to paste credentials when the current shell or `.env` already provides them.

The Tracker helper disables TLS certificate verification by default. Do not use an `--insecure` flag; it is not supported. Use `--verify-tls` only when the user asks to validate certificate behavior or local instructions explicitly require certificate verification.

If a Tracker helper command fails because of network, DNS, or sandbox restrictions, retry the same direct helper invocation with required escalation according to the current Codex environment rules. Do not treat that failure as a workflow blocker by itself.

## Verification

Use [references/verification-and-pitfalls.md](references/verification-and-pitfalls.md) for the workflow verification checklist and known pitfalls before considering a phase complete.

Use [references/08-finish.md](references/08-finish.md) for final acceptance, PR merge checks, final Tracker comments, final status, and final response requirements.

## Starter Prompt

Выполни задачу из Яндекс Трекера `<ISSUE-KEY>` по проектному workflow: прочитай контекст, уточни недостающие требования, согласуй план, реализуй по этапам, обновляй задачу в Трекере и подготовь PR.
