# Yandex Tracker Task Workflow Comment Templates

Use real line breaks in Tracker comments. Prefer interactive `add-comment --stdin`:

1. Start `python3 .agents/skills/yandex-tracker-api/scripts/ytracker_api.py add-comment <ISSUE-KEY> --stdin --confirm <ISSUE-KEY>` in TTY/interactive mode.
2. Send the comment text through stdin.
3. Send EOF as a separate stdin write (`\u0004`).

Use `add-comment --text-file` when interactive stdin is not practical. Use inline comment text only for one-line comments. Avoid shell pipes for multiline comments when they can trigger approval prompts or empty stdin behavior.

Use `add-comment` only for clarification, the plan, initial `Codex State`, and the final Tracker comment. Use `edit-comment` or a generic comment PATCH for later `Codex State` updates; do not add a new progress comment.

## Contents

- [Clarification](#clarification)
- [Plan](#plan)
- [Codex State](#codex-state)
- [External Feedback](#external-feedback)
- [Review](#review)
- [Pre-PR Migration Gate](#pre-pr-migration-gate)
- [Final Tracker Comment](#final-tracker-comment)
- [PR Body](#pr-body)

## Clarification

```text
Нужны уточнения перед реализацией:

1. ...
2. ...

Без этих данных есть риск реализовать не тот сценарий.
```

## Plan

The plan is the first normal workflow comment after readiness. Keep it compact: list what will be done and expected files/directories. Do not repeat standard verification rules or likely test commands already covered by the skill.

```text
План выполнения:

1. <что сделать> — файлы/директории: `path/to/file.php`, `path/to/directory/`.
2. <что сделать> — файлы/директории: ...
3. <что сделать> — файлы/директории: ...

Планируемые изменения по файлам:

- `path/to/file.php` - одно предложение о том, что будет изменено.
- `path/to/other-file.php` - одно предложение о том, что будет изменено.

После подтверждения переведу задачу в работу, назначу на себя, создам чек-лист и рабочую ветку.
```

Example:

```text
План выполнения:

1. Обновить backend-логику расчета статуса — файлы/директории: `app/Service/OrderStatusService.php`, связанные вызовы сервиса.
2. Обновить отображение статуса в Control UI — файлы/директории: `templates/control/order/status.html.twig`, связанные view-модели или контроллеры.
3. Добавить или скорректировать покрытие для измененного сценария — файлы/директории: `tests/OrderStatusServiceTest.php`, ближайшие UI/view tests при наличии.

Планируемые изменения по файлам:

- `app/Service/OrderStatusService.php` - будет обновлена логика расчета статуса заказа.
- `templates/control/order/status.html.twig` - будет скорректировано отображение статуса в Control UI.
- `tests/OrderStatusServiceTest.php` - будет добавлено или обновлено покрытие измененного сценария.

После подтверждения переведу задачу в работу, назначу на себя, создам чек-лист и рабочую ветку.
```

## Codex State

Create this comment once after the plan is confirmed, then edit it in place with `edit-comment`. Keep it to 5-8 short lines. Replace stale information instead of appending a chronological log.

```text
Codex State:
- phase: <В работе / stage 1/3 / Ревью / Тестируется / blocked>
- done: <кратко, пункты плана и commit hashes или none>
- current: <что сейчас делается или что ожидает принятия>
- feedback: <краткий actionable summary или none>
- checks: <последние существенные проверки или pending>
- PR: <url или none>
- next: <следующее действие>
```

Example after a stage:

```text
Codex State:
- phase: stage 2/3 accepted
- done: пункт 1 `abc1234`, пункт 2 `def5678`
- current: ожидается пункт 3 - покрытие сценария статуса
- feedback: none
- checks: focused service test passed; review-gate pending
- PR: none
- next: реализовать пункт 3 после подтверждения
```

## External Feedback

Use `Codex State` for remarks, corrections, scope changes, or review/testing feedback that changes what the agent must do. Do not use it for plain stage acceptance such as `принято`, `ок`, or `подходит`; acceptance is recorded by completing the checklist item. Never write an acceptance-only comment such as `Этап N принят и закоммичен`.

Summarize long feedback to the actionable decision or scope change:

```text
feedback: изменить ...; не менять ...; источник: пользователь, <date/time if useful>
```

## Review

Update `Codex State` instead of adding review comments.

```text
phase: Ревью
done: все пункты плана закоммичены: <hashes>
checks: focused checks passed; review-gate running
next: review-workflow по измененным файлам
```

Review problem fix:

```text
phase: Ревью
done: исправлено замечание проверки, commit <hash>
current: review-gate повторен / ожидает повтора
checks: <focused check>: passed
next: продолжить PR handoff после чистого review-gate
```

## Pre-PR Migration Gate

No migration changes:

```text
checks: migration gate passed; изменений в migrations/ относительно <target> нет
```

Migration consolidation:

```text
checks: migration gate passed; индекс <vYYMMDDN>; нормализовано ...
done: migration consolidation commit <hash>
```

## Final Tracker Comment

Write the final Tracker comment for non-technical readers, including service support. Use a helpdesk documentation style: first explain the user-visible result in plain language, then explain why it matters, then give short working instructions. Avoid implementation jargon unless it is needed; when a technical term is unavoidable, explain its user-facing meaning.

The comment must answer these questions:

- What new capability, behavior, screen, field, integration, or fix appeared?
- What is it used for, and in which user cases?
- How should a user, manager, operator, or support specialist work with it?

Use concrete names from the product UI and business domain. Do not write only "backend updated", "logic fixed", or "added validation"; explain the visible effect and the scenario where a person will notice it.

```text
Задача выполнена и подготовлена к релизу.

Что нового появилось:
- ...

Для чего это используется:
- ...

Пользовательские сценарии:
- ...

Как с этим работать:
1. ...
2. ...
3. ...

Важно для техподдержки:
- ...

PR: ...

Проверка:
- ...
- <command>: passed.
- <command>: не запускался, потому что ...
```

Example:

```text
Задача выполнена и подготовлена к релизу.

Что нового появилось:
- В карточке заказа теперь показывается отдельный статус онлайн-оплаты. По нему видно, ожидает ли заказ оплаты, успешно ли оплачен или требует проверки.

Для чего это используется:
- Статус помогает кассиру и оператору понять, можно ли передавать заказ в работу без ручной проверки платежа.
- Поддержка может быстрее разбирать обращения клиентов, потому что результат оплаты виден в заказе, а не только во внешнем платежном сервисе.

Пользовательские сценарии:
- Клиент оплатил заказ онлайн, оператор открывает заказ и видит, что платеж прошел.
- Клиент говорит, что оплатил заказ, но заказ не ушел в работу; поддержка проверяет статус оплаты в карточке заказа и понимает, где остановился процесс.
- Платеж не завершился; кассир видит это до приготовления заказа и просит клиента повторить оплату или выбрать другой способ.

Как с этим работать:
1. Откройте заказ в панели управления.
2. Найдите блок оплаты и проверьте статус онлайн-оплаты.
3. Если статус успешный, заказ можно обрабатывать дальше.
4. Если статус ожидает оплаты или содержит ошибку, проверьте оплату у клиента или передайте обращение второй линии с номером заказа.

Важно для техподдержки:
- При обращении клиента фиксируйте номер заказа, текущий статус оплаты и время последней попытки оплаты.
- Если статус не меняется после успешной оплаты у клиента, передавайте обращение разработчикам вместе с номером заказа и скриншотом статуса.

PR: ...

Проверка:
- ...
- <command>: passed.
- <command>: не запускался, потому что ...
```

## PR Body

```text
<1-2 коротких предложения о результате задачи.>

Проверка:
- <command>: passed.
- <command>: не запускался, потому что ...
```

PR title format:

```text
<ISSUE-KEY> <short human summary>
```

Example:

```text
SF-782 Новый способ авторизации iikoCloud
```

Do not use Conventional Commit titles such as `feat(api): ...` for PRs created by this workflow.

If `make test` or another main project test command exists and passes, replace the gap line with `<command>: passed`. If the command exists but fails because infrastructure is unavailable, write the concrete infrastructure blocker instead of treating it as a code failure. If the command is unsupported or cannot be run, include that gap in both the PR body and the final Tracker comment.
