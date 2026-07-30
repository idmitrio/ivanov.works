---
name: yandex-tracker-api
description: Work with Yandex Tracker through the direct REST API and the local helper script in `scripts/`. Use when Codex needs to read or modify Tracker data directly through `api.tracker.yandex.net`.
---

# Yandex Tracker API

## Overview

Use this skill for Yandex Tracker operations in this repository.

Reference material:

- [references/commands.md](references/commands.md) for common helper commands, generic requests, task discovery, and smoke tests.
- [references/api-operations.md](references/api-operations.md) for status, field, tag, checklist, follower, comment, attachment, link, and component operations.
- [references/tracker-metadata.md](references/tracker-metadata.md) for status, issue type, resolution, field key, and component tables.

## Capabilities

Supported through the direct API/helper:

- List issues assigned to the current user in the configured queue.
- Read issue details and selected fields.
- Create issues in the configured queue.
- Assign an existing issue to a user by id.
- Change issue summary, type, priority, components, tags, and checklist fields through issue patching.
- Read available status transitions, then execute a transition by transition id or target status key.
- Add, read, edit, and delete issue comments.
- Mark one checklist item complete or incomplete by 1-based index or exact text.
- Read, create, and delete issue links.
- List queue/organization components exposed by the API.
- List, download, decode text, upload, attach to description, and delete issue attachments.
- Use a generic `request` subcommand for endpoints not wrapped by a high-level helper command.

Prefer the direct API helper for Tracker work in this repository.

## Not Supported

- Physical issue deletion. Confirmed `DELETE /v3/issues/<issue_ID>` returns `405 Method Not Allowed`; clean up test issues by moving them to `cancelled` with an appropriate resolution.
- Stable checklist item ids after full checklist replacement. Read the issue again after checklist writes.
- Universal status or resolution keys across all queues. Queue workflow settings can reject otherwise valid-looking keys.
- Universal component names across all queues. Components are queue-specific.

## Known Pitfalls

- Global helper flags such as `--verify-tls` and `--compact` must be placed before the subcommand. Use `python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py --compact attachment-text SF-739 21`, not `... attachment-text SF-739 21 --compact`.

## Safety

- Never commit real `YANDEX_TRACKER_TOKEN` values.
- Keep credentials in the shell environment or repository-local `.env`; `.env` is ignored by git in this repository.
- Use `YANDEX_TRACKER_TOKEN` for the OAuth token.
- Use `YANDEX_TRACKER_ORG` for the organization id and send it as `X-Org-ID`.
- Use `YANDEX_TRACKER_QUEUE` for the default queue key. If it is not set, the helper uses `SF`.
- Do not log or paste token values in final answers, docs, commits, or examples.
- TLS certificate verification is disabled by default in this workspace. Use `--verify-tls` only when the user asks to validate certificate behavior or local instructions explicitly require certificate verification.
- Existing-issue write commands require `--confirm <issue_key>`. Generic non-GET `request` calls require `--confirm-write`, except read-only `POST /issues/_search`.
- Prefer high-level helper subcommands for Tracker writes instead of shell-quoted JSON/text when a specialized command exists.
- For multiline comments, prefer `add-comment --stdin` or `add-comment --text-file` so the full text is not part of the command line and approval prefixes stay reusable.
- If a helper command fails with a network or DNS error such as `[Errno 8] nodename nor servname provided, or not known`, treat it as a Codex network sandbox failure. Retry the same direct helper invocation with required escalation and request a narrow persistent prefix rule such as `["python3", ".agents/skills/yandex-tracker-api/scripts/ytracker_api.py", "add-comment", "SF-780", "--stdin", "--confirm", "SF-780"]` for repeated comments or `["python3", ".agents/skills/yandex-tracker-api/scripts/ytracker_api.py"]` for routine Tracker helper work. Do not wrap normal helper calls in `/bin/zsh -lc`, inline env assignments, heredocs, redirects, or command substitutions when a direct invocation can work, because those forms may bypass the reusable approval rule.

## Helper Script

Primary entrypoint:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py --help
```

The helper script:

- calls `https://api.tracker.yandex.net/v3`;
- sends `Authorization: OAuth $YANDEX_TRACKER_TOKEN`;
- sends `X-Org-ID: $YANDEX_TRACKER_ORG`;
- uses `YANDEX_TRACKER_QUEUE` as the default queue for `my-issues` and `create-issue`, falling back to `SF`;
- reads env variables from the shell first, then from repository-local `.env`;
- prints JSON results to stdout.
- disables TLS certificate verification by default and supports `--verify-tls` for strict verification.

Use the helper without TLS flags for normal local Tracker API work in this repository. Use `--verify-tls` only when the user asks to validate TLS behavior or local instructions explicitly require certificate verification.

## Common Commands

Use [references/commands.md](references/commands.md) for common helper commands, generic request examples, task discovery commands, and the live smoke test command.

## API Basics

The helper calls `https://api.tracker.yandex.net/v3` with `Authorization: OAuth <token>` and `X-Org-ID: <organization_id>`. Use `X-Cloud-Org-ID` only if the Tracker organization is linked to Yandex Cloud Organization. In this repository the configured organization variable is `YANDEX_TRACKER_ORG`, used as `X-Org-ID`. See [references/api-operations.md](references/api-operations.md) for the expanded API basics.

## Task Discovery

When the user asks for assigned tasks, query all issues assigned to the current Tracker user. Do not restrict the search to "open" or "in progress" statuses unless the user explicitly asks for a status subset.

Prefer `my-issues`. See [references/commands.md](references/commands.md) for the helper command and low-level equivalent.

## Task Workflow

When working on a task from Tracker:

1. Read the issue before making code changes.
2. Request fields useful for implementation context; use the command from [references/commands.md](references/commands.md).
3. If the issue is underspecified, summarize what is known and ask for clarification before implementing risky behavior.
4. Move the issue into the appropriate status only when the workflow requires it.
5. Add a concise result comment when useful.
6. When closing or canceling, pass the required `resolution` and verify both `status` and `resolution`.

Resolution constraints can depend on issue type and queue workflow. Confirmed in queue `SF`:

- For `task`, canceling with `dontDo` ("Не делаем") works.
- For `bug`, canceling with `dontDo` is rejected; use `cantReproduce` ("Не воспроизводится") for cancellation.

## API Operations

Use [references/api-operations.md](references/api-operations.md) for detailed examples and caveats for status transitions, issue fields, tags, checklists, followers, comments, attachments, links, and components.

## Metadata Reference

For full status, issue type, resolution, field key, and component tables, use [references/tracker-metadata.md](references/tracker-metadata.md).

## Verification

Read operations are complete when the helper returns JSON for the requested object or list and the selected fields are sufficient for the task.

Write operations are complete when the helper returns success and the changed issue, comment, link, attachment, checklist, component list, status, or resolution is read back when practical. For status and resolution changes, verify both fields after the transition. For checklist changes, read back checklist fields because counters or ids can be stale after writes.

Run the live smoke test on temporary issues when changing the helper:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/smoke_test.py --queue SF
```

## Official API References

- Creating an issue: https://yandex.ru/support/tracker/en/api-ref/issues/create-issue
- Editing an issue: https://yandex.ru/support/tracker/en/api-ref/issues/patch-issue
- Searching issues: https://yandex.ru/support/tracker/en/concepts/issues/search-issues
- Getting transitions: https://yandex.ru/support/tracker/en/api-ref/issues/get-transitions
- Making transitions: https://yandex.ru/support/tracker/en/concepts/issues/new-transition
- Adding comments: https://yandex.ru/support/tracker/en/api-ref/issues/add-comment
- Editing comments: https://yandex.ru/support/tracker/en/concepts/issues/edit-comment
- Deleting comments: https://yandex.ru/support/tracker/en/concepts/issues/delete-comment
- Issue links: https://yandex.ru/support/tracker/en/api-ref/issues/link-issue
- Listing issue attachments: https://yandex.ru/support/tracker/en/concepts/issues/get-attachments-list
- Downloading issue attachments: https://yandex.ru/support/tracker/en/api-ref/issues/get-attachment
- Attaching files to issues: https://yandex.ru/support/tracker/en/api-ref/issues/post-attachment
- Components: https://yandex.ru/support/tracker/en/api-ref/queues/get-components
