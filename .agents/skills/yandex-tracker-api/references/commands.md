# Yandex Tracker API Commands

## Contents

- Helper Entrypoint
- Common Commands
- Generic Request
- Task Discovery
- Smoke Test

Use these commands from the target project root unless local instructions say otherwise.

## Helper Entrypoint

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py --help
```

## Common Commands

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py my-issues
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py get-issue SF-746 --fields key summary status priority assignee
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py create-issue --summary "Задача Codex" --description "Описание"
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py create-issue --queue ABC --summary "Задача Codex" --description "Описание"
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py assign SF-734 --user-id 8000000000000005 --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-summary SF-747 "Создать документацию по API Control" --confirm SF-747
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py change-status SF-734 inProgress --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py change-status SF-734 closed --resolution fixed --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-type SF-734 bug --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-priority SF-734 critical --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py components
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-components SF-747 Control Backend --confirm SF-747
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py clear-components SF-747 --confirm SF-747
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-tags SF-747 codex-api-smoke test-one --confirm SF-747
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-tags SF-747 test --confirm SF-747
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py clear-tags SF-747 --confirm SF-747
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py set-checklist SF-734 "делай раз" "делай два" --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py checklist-complete SF-734 --index 1 --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py checklist-uncomplete SF-734 --text "делай раз" --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py clear-checklist SF-734 --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment SF-734 "Начали делать." --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment SF-734 --stdin --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment SF-734 --text-file /tmp/SF-734-comment.txt --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py comments SF-734 --expand all
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py edit-comment SF-734 COMMENT_ID "Комментарий изменен." --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py delete-comment SF-734 COMMENT_ID --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py links SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-link SF-734 SF-142 --relationship relates --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py delete-link SF-734 LINK_ID --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachments SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attachment-text SF-734 ATTACHMENT_ID
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py download-attachment SF-734 ATTACHMENT_ID --output /tmp/SF-734-attachment.txt
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attach-file SF-734 ~/Downloads/5j63bgf0n9.png --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py delete-attachment SF-734 ATTACHMENT_ID --confirm SF-734
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py attach-description-file SF-734 ~/Downloads/5j63bgf0n9.png --confirm SF-734
```

## Generic Request

Read:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py request \
  GET \
  /issues/SF-746 \
  --query fields=key,summary,status,priority
```

Write:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py request \
  PATCH \
  /issues/SF-747 \
  --body '{"summary":"Создать документацию по API Control"}' \
  --confirm-write
```

## Task Discovery

Query all issues assigned to the current Tracker user:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py my-issues
```

Low-level equivalent:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py request \
  POST \
  /issues/_search \
  --query perPage=20 \
  --query fields=key,summary,status,priority,assignee \
  --body '{"filter":{"queue":"SF","assignee":"me()"}}'
```

Read implementation context:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py get-issue SF-000 \
  --fields key summary description status statusType priority type assignee author createdBy created updated parent epic components tags sprint qaEngineer resolution
```

## Smoke Test

Run the live smoke test on temporary issues when changing the helper:

```bash
python3 .agents/skills/yandex-tracker-api/scripts/smoke_test.py --queue SF
```
