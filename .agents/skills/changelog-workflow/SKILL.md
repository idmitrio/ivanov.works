---
name: changelog-workflow
description: Create or update changelog entries while preserving the target repository's existing changelog format. Use when Codex needs to prepare release notes, move Unreleased entries into a version, add compare links, or review changelog quality using Keep a Changelog guidance without overriding local style.
---

# Changelog Workflow

## Overview

Use this skill when the task involves creating, updating, or reviewing a changelog entry.

The target repository's existing `CHANGELOG.md` style is authoritative. Use Keep a Changelog 1.1.0 as fallback guidance and as a quality checklist only when it does not conflict with the existing file.

## Capabilities

- Find and inspect the existing changelog file before editing it.
- Preserve the existing language, heading format, date format, version prefix, section names, spacing, and compare-link style.
- Add a new version entry at the top of the released versions.
- Move relevant `[Unreleased]` changes into a new version entry when the file uses that section.
- Summarize notable changes without dumping raw commit logs.
- Group changes by the existing section taxonomy.
- Add or update version compare links, including reference-style GitHub compare links at the bottom of the file when that is the existing style.
- Stop for user approval before the changelog entry is committed as part of a release.

## Style Priority

Apply rules in this order:

1. Follow the existing changelog file exactly when it has an established style.
2. Follow repository-local release or documentation instructions when they explicitly refine the changelog style.
3. Use Keep a Changelog 1.1.0 only as fallback guidance for missing decisions or as a quality check.

Do not replace a repository's existing regional date format, language, section names, or version prefix only because Keep a Changelog recommends a different default.

## Not Supported

- Do not invent a new changelog format when the repository already has one.
- Do not add `[Unreleased]`, compare links, or new section names unless the existing file, local rules, or user request calls for them.
- Do not include raw commit logs, merge commits, or implementation-only noise as changelog entries.
- Do not approve release notes on the user's behalf when the release workflow requires confirmation.

## Workflow

1. Locate the changelog file, usually `CHANGELOG.md`.
2. Read the top entries and link definitions to identify the existing format.
3. Determine the new version and release date from the release task or local release workflow.
4. Build the source change list from the release branch, PR context, existing `[Unreleased]` section, or user-provided notes.
5. Write a concise human-facing summary of notable changes, not a commit-by-commit list.
6. Group items under the existing section names.
7. Omit empty sections.
8. Insert the new version entry where the file's ordering expects it, usually above the previous release.
9. If the file has `[Unreleased]`, move released items into the new version and leave only still-unreleased items there.
10. Add or update compare links using the existing link format when the file uses compare links.
11. If the file stores version links at the bottom, add the new version link there and verify the new version heading resolves to it.
12. Review the entry for consistency with nearby releases.
13. Stop and ask the user to confirm the changelog text before using it in a release commit.

## Existing Format Detection

Before writing, inspect at least the latest two release entries and any link definitions.

Record these details mentally and preserve them:

- top-level title, if present
- version heading shape, for example `## [v4.13.0] - 23.04.2026`
- version prefix, such as `v`
- date format
- release ordering
- language
- section names and ordering
- bullet style and punctuation
- whether compare links are inline or reference-style, and where reference definitions are stored
- whether `[Unreleased]` exists

## Keep A Changelog Guidance

Use these principles when the existing file does not answer a question:

- Changelogs are for humans, not machines.
- Every release should have an entry.
- The latest release should appear first.
- Release dates should be shown.
- The same types of changes should be grouped.
- Versions and sections should be linkable when the file style supports links.
- Prefer ISO 8601 dates, `YYYY-MM-DD`, only when the repository has no established date format.

Standard Keep a Changelog section types are:

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for removed features.
- `Fixed` for bug fixes.
- `Security` for vulnerability fixes.

When the changelog is in another language, use the existing translated section names. For Russian changelogs, common names include `Добавлено`, `Изменено`, `Устарело`, `Удалено`, `Исправлено`, and `Безопасность`, but only use names that fit the repository's existing style or the current change.

## Notable Change Rule

Do not paste raw `git log` output into the changelog.

Include user-facing or operator-relevant changes, important API or configuration changes, migrations, deprecations, removals, security fixes, and behavior changes. Exclude internal cleanup, noisy merge commits, trivial formatting, and implementation details unless they materially affect users, deployers, or maintainers.

## Unreleased Rule

If the changelog has an `[Unreleased]` section:

- Move items included in the release into the new version entry.
- Keep unrelated future items under `[Unreleased]`.
- Preserve the existing `[Unreleased]` link format.

If there is no `[Unreleased]` section, do not add one unless the repository already expects that convention or the user asks for it.

## Compare Link Rule

When the changelog already has compare links, add the new link in the same style. This is required for release changelog updates; do not stop after adding only the version heading and notes.

Choose the left side from the previous release tag or existing previous changelog link. Choose the right side from the new release tag. If the repository uses a version prefix such as `v`, preserve it.

If the existing file uses reference-style GitHub compare links at the bottom, add the new link near the other version link definitions, usually before the previous release link:

```md
[v4.14.0]: https://github.com/org/repo/compare/v4.13.0...v4.14.0

[v4.13.0]: https://github.com/org/repo/compare/v4.12.4...v4.13.0
```

If the changelog does not use compare links, do not introduce them unless the release workflow or user explicitly requires them.

## Examples

Existing Russian format:

```md
## [v4.13.0] - 23.04.2026

### Добавлено

- Метод клиентского API для получения мест вместе с городами.

### Исправлено

- Сохранение нулевых значений связей зон доставки.
```

Preserve that style for the next release:

```md
## [v4.14.0] - 30.04.2026

### Добавлено

- Новый пользовательский сценарий, описанный на уровне результата.

### Исправлено

- Исправление заметной ошибки без перечисления внутренних коммитов.

[v4.14.0]: https://github.com/org/repo/compare/v4.13.0...v4.14.0

[v4.13.0]: https://github.com/org/repo/compare/v4.12.4...v4.13.0
```

## Verification

- The new entry follows the nearby changelog entries' format.
- The release date and version match the release task.
- Empty sections were not added.
- Notable changes are grouped consistently.
- Raw commit log lines and merge commits were not copied into the entry.
- Compare links were added or skipped according to the existing file style; when reference-style links exist at the bottom, the new version link was added there.
- The user approved the changelog text before the release commit.

## Official Reference

- Keep a Changelog 1.1.0: https://keepachangelog.com/en/1.1.0/
