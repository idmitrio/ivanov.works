# Phase 1: Readiness

## Get The Issue Key

Require a Yandex Tracker issue key such as `<QUEUE>-123`.

If the user provides only a number, derive the issue key from `YANDEX_TRACKER_QUEUE`; if that variable is not set, use `SF`.

If the issue key is missing and cannot be derived, ask for it. If the user says the issue key is unknown, stop.

Optional helper sanity check, especially after updating shared skills:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py --help
```

## Read Tracker Context

Read the issue with implementation fields:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py get-issue <ISSUE-KEY> \
  --fields key summary description status statusType type assignee components tags priority parent epic links checklistItems checklistTotal checklistDone created updated
```

Read comments needed to understand scope. On a new task this can include the full requirement discussion. On a resumed task, prefer the plan comment, latest `Codex State`, and recent human feedback; avoid loading old progress comments unless state reconstruction is ambiguous:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py comments <ISSUE-KEY> --per-page 10 --expand all
```

Read linked issues:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py links <ISSUE-KEY>
```

If linked issues affect implementation, read each linked issue summary, description, status, assignee, components, and only the comments needed to understand implementation scope before deciding readiness.

Read issue attachments:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachments <ISSUE-KEY>
```

If attachments include text-like files that may affect implementation, download and analyze them:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachment-text <ISSUE-KEY> <ATTACHMENT-ID>
```

Treat files as text-like when their MIME type starts with `text/`, is a common structured text type such as JSON, YAML, XML, CSV, Markdown, or SQL, or the filename extension clearly identifies a text format. If an attachment is binary or cannot be decoded as text, summarize its metadata and ask for clarification when the task depends on it.

## Evaluate Readiness

Analyze:

- what behavior, UI, API, data model, migrations, settings, background jobs, or integrations must change;
- whether acceptance criteria are explicit enough;
- whether linked issues, comments, `Codex State`, or attached text files modify the scope;
- whether there are contradictions between title, description, comments, linked tasks, and attached text files;
- whether implementation can be safely split into reviewable stages.

If the task is underspecified, do not implement it yet.

## Request Clarification When Needed

When clarification is required:

1. Move the issue to `Требуется информация` using an available Tracker transition.
2. Add a Tracker comment with concrete questions or a proposed scope adjustment.
3. Print the same comment text in the console.
4. Stop and wait for the user or Tracker comments.

Use the clarification template from [comment-templates.md](comment-templates.md).

After clarification arrives outside Tracker before the task is ready, add it as a concise Tracker clarification comment and repeat readiness evaluation.
