# Yandex Tracker Task Workflow Commands

Use these commands from the target project root unless local instructions say otherwise.

## Tracker Reads

Read issue:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py get-issue <ISSUE-KEY> \
  --fields key summary description status type assignee components links checklistItems checklistTotal checklistDone
```

Read comments:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py comments <ISSUE-KEY> --per-page 10 --expand all
```

Use this first on resume to find the plan comment, latest `Codex State`, and recent human feedback. Read more history only when `Codex State`, checklist, and git state are missing or contradictory.

Read links:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py links <ISSUE-KEY>
```

Read attachments and attached text files:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachments <ISSUE-KEY>
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachment-text <ISSUE-KEY> <ATTACHMENT-ID>
```

Read available transitions:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py request GET /issues/<ISSUE-KEY>/transitions
```

Verify issue state:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py get-issue <ISSUE-KEY> \
  --fields key summary status assignee checklistTotal checklistDone components
```

## Tracker Writes

Run write commands for one issue as separate tool calls. Do not chain several status, checklist, or comment writes in one shell command; separate calls make failures visible and easier to resume.

Add multiline comment (preferred):

1. Start the helper in interactive stdin mode:

   ```bash
   python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment <ISSUE-KEY> --stdin --confirm <ISSUE-KEY>
   ```

2. Send the comment text through stdin.
3. Send EOF as a separate stdin write (`\u0004`).

Use this interactive stdin flow before trying shell pipes or escalation. Non-interactive `--stdin`
can receive empty input, and shell pipes can trigger approval prompts in some Codex environments.

Add comment from a prepared file:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment <ISSUE-KEY> --text-file /tmp/<ISSUE-KEY>-comment.txt --confirm <ISSUE-KEY>
```

Edit the existing `Codex State` comment:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py edit-comment <ISSUE-KEY> <COMMENT-ID> 'Codex State:
- phase: ...
- done: ...
- current: ...
- feedback: ...
- checks: ...
- PR: ...
- next: ...' --confirm <ISSUE-KEY>
```

If multiline shell quoting is unreliable, use the generic API request to `PATCH /issues/<ISSUE-KEY>/comments/<COMMENT-ID>` with body `{"text":"..."}` and `--confirm-write`. Do not create a second `Codex State` comment unless the original was deleted or cannot be edited.

If adding a comment times out or returns a transient server error, read recent comments before retrying when possible. Retry with `--text-file` for long comments or when interactive stdin is unreliable. Avoid duplicate comments unless verification is impossible and the workflow needs the Tracker record.

Change status:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py change-status <ISSUE-KEY> <status-key-or-transition-id> --confirm <ISSUE-KEY>
```

Assign:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py assign <ISSUE-KEY> --user-id <tracker-user-id> --confirm <ISSUE-KEY>
```

Set and complete checklist:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-checklist <ISSUE-KEY> "Пункт 1" "Пункт 2" --confirm <ISSUE-KEY>
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py checklist-complete <ISSUE-KEY> --index 1 --confirm <ISSUE-KEY>
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py checklist-complete <ISSUE-KEY> --text "Exact checklist text" --confirm <ISSUE-KEY>
```

After a failed or interrupted checklist write, verify issue state before retrying:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py get-issue <ISSUE-KEY> \
  --fields key status checklistTotal checklistDone checklistItems
```
