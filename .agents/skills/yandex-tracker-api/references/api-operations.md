# Yandex Tracker API Operations

## Contents

- API Basics
- Change Issue Status
- Change Issue Fields
- Tags
- Checklists
- Followers
- Comments
- Attachments
- Links
- Components

Use high-level helper commands when possible. Use generic `request` only for endpoints without a dedicated helper command or when debugging API behavior.

## API Basics

Base URL:

```text
https://api.tracker.yandex.net/v3
```

Required headers:

```text
Authorization: OAuth <token>
X-Org-ID: <organization_id>
```

Use `X-Cloud-Org-ID` only if the Tracker organization is linked to Yandex Cloud Organization. In this repository the configured organization variable is `YANDEX_TRACKER_ORG`, used as `X-Org-ID`.

## Change Issue Status

The direct API changes status through transitions:

1. `GET /v3/issues/<issue_ID>/transitions`
2. `POST /v3/issues/<issue_ID>/transitions/<transition_ID>/_execute`

The helper accepts either a transition id or a target status key. When a target status key is passed, it reads available transitions and uses the transition whose `to.key` matches.

Example:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py change-status SF-734 selectedForDev \
  --confirm SF-734
```

Closing with a resolution:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py change-status \
  SF-734 \
  closed \
  --resolution fixed \
  --confirm SF-734
```

Canceling a task:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py change-status \
  SF-734 \
  cancelled \
  --resolution dontDo \
  --confirm SF-734
```

Canceling a bug:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py change-status \
  SF-734 \
  cancelled \
  --resolution cantReproduce \
  --confirm SF-734
```

If Tracker rejects a status key, list transitions directly:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py request GET /issues/SF-734/transitions
```

## Change Issue Fields

Use high-level helper commands for common field updates, or `update-issue` for fields without a dedicated wrapper.

Summary:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-summary SF-747 "Создать документацию по API Control" --confirm SF-747
```

Type:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-type SF-734 bug --confirm SF-734
```

Priority:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-priority SF-734 critical --confirm SF-734
```

Generic patch:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py update-issue \
  SF-734 \
  '{"description":"Новое описание","markupType":"md"}' \
  --confirm SF-734
```

## Tags

Replace all tags:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-tags SF-747 codex-api-smoke test-one --confirm SF-747
```

Add tags while preserving existing values:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-tags SF-747 test-two test-three --confirm SF-747
```

Clear tags:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py clear-tags SF-747 --confirm SF-747
```

## Checklists

Create or replace a checklist:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-checklist \
  SF-734 \
  "делай раз" \
  "делай два" \
  "делай три" \
  --confirm SF-734
```

Clear a checklist:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py clear-checklist SF-734 --confirm SF-734
```

`clear-checklist` uses `DELETE /v3/issues/<issue_ID>/checklistItems`, reads the issue back, and automatically falls back to `update-issue {"checklistItems":[]}` when Tracker returns stale checklist counters or items.

Mark one item complete or incomplete without manually building the full JSON body:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py checklist-complete SF-734 --index 1 --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py checklist-complete SF-734 --text "делай раз" --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py checklist-uncomplete SF-734 --index 1 --confirm SF-734
```

These commands read the current checklist, find the item by 1-based index or exact text, preserve the text and checked state of all other items, write the updated checklist, then read the issue back and print `checklistDone/checklistTotal`. They intentionally do not rely on stored checklist item ids because Tracker can recreate ids after checklist writes.

Smoke-tested behavior in `SF-778`:

- `set-checklist` and `update-issue` with `checklistItems` can recreate checklist item ids. Do not keep old checklist item ids as stable identifiers after any full checklist patch.
- `clear-checklist` now performs the read-back and fallback itself; still inspect the returned `checklistItems`, `checklistTotal`, `checklistDone`, and `cleanup_fallback` fields when cleanup matters.
- `checklist-complete` and `checklist-uncomplete` are safer for routine progress updates than manual `update-issue` patches.

## Followers

Followers can be removed through issue patching with the array `remove` operator:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py update-issue \
  SF-734 \
  '{"followers":{"remove":["8000000000000005"]}}' \
  --confirm SF-734
```

Confirmed behavior: direct `DELETE /v3/issues/<issue_ID>/followers/<user_ID>` is not a supported endpoint in this workspace.

## Comments

The direct API supports comment creation, reading, editing, and deletion.

Create:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment SF-734 "Начали делать." --confirm SF-734
```

Create a multiline comment with a stable command line:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment SF-734 --stdin --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment SF-734 --text-file /tmp/SF-734-comment.txt --confirm SF-734
```

Use `--stdin` when the execution environment can provide stdin directly. Use `--text-file` when a temporary file is easier; a reusable approval prefix can stop at `--text-file`, while only the file contents change. Avoid `$'...'`, heredocs, and large quoted comment text in documented normal commands because they make Codex approvals unique per comment.

Read:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py comments SF-734 --expand all
```

Edit:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py edit-comment SF-734 COMMENT_ID "Комментарий изменен." --confirm SF-734
```

Delete:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py delete-comment SF-734 COMMENT_ID --confirm SF-734
```

## Attachments

The direct API supports issue attachments.

List:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachments SF-734
```

Decode a text attachment for analysis:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachment-text SF-734 ATTACHMENT_ID
```

If the attachment uses a non-UTF-8 encoding, pass it explicitly:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachment-text SF-734 ATTACHMENT_ID --encoding windows-1251
```

`attachment-text` refuses files whose attachment metadata does not look text-like. Use `download-attachment` for binary files. If Tracker metadata is wrong but the file is known text, pass `--force`.

Download an attachment to disk:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py download-attachment SF-734 ATTACHMENT_ID --output /tmp/SF-734-attachment.txt
```

Upload:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attach-file SF-734 ~/Downloads/5j63bgf0n9.png --confirm SF-734
```

Delete:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py delete-attachment SF-734 ATTACHMENT_ID --confirm SF-734
```

Attach a file to the issue description, like files added through the description editor in Tracker UI:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attach-description-file SF-734 ~/Downloads/5j63bgf0n9.png --confirm SF-734
```

Implementation detail:

1. Upload the file as a temporary attachment with `POST /v3/attachments/`.
2. Patch the issue with `{"descriptionAttachmentIds":["<temporary_file_id>"]}`.

Do not insert `https://api.tracker.yandex.net/v3/issues/.../attachments/...` URLs into `description` as markdown image links. Those API download URLs require OAuth headers and do not open correctly from the Tracker UI description.

## Links

The direct API supports issue links.

Read:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py links SF-734
```

Create:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-link SF-734 SF-142 --relationship relates --confirm SF-734
```

Delete:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py delete-link SF-734 LINK_ID --confirm SF-734
```

If Tracker rejects the relationship key, inspect existing links or queue workflow conventions and retry with the accepted relationship key.

## Components

Components are queue-specific. The direct API can list components:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py components
```

Known queue `SF` components are listed in [tracker-metadata.md](tracker-metadata.md):

- Backend `2`
- Control `4`
- Frontend `1`
- Mobile `5`
- SaaS `3`

Set components:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-components SF-747 Control Backend --confirm SF-747
```

Clear components:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py clear-components SF-747 --confirm SF-747
```
