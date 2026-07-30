---
name: sf-migration-workflow
description: Create and register new database migrations for this repository. Use when Codex needs to add a migration under `migrations/`, choose the next `vYYMMDDN` prefix, update `app/Base/Migrator.php`, or follow the repository's migration-specific conventions.
---

# Migration Workflow

## Overview

Use this skill when the task is to create or update migrations in a Smartofood-style repository.

Read the migration-related rules in [AGENTS.md](../../../AGENTS.md) first. Use this file for the practical workflow.

This skill assumes the project has `migrations/`, `app/Base/Migrator.php`, and the migration naming and registration conventions documented below. If those files or conventions are absent, use a project-local migration workflow instead.

## Recommended Reasoning

Default: `high`

Use `high` for normal migration creation because the workflow must keep migration files, naming prefixes, and `app/Base/Migrator.php` registration aligned. Use `xhigh` for data migrations, backfills, destructive schema changes, index or constraint changes on large tables, production compatibility concerns, or migrations tied to multi-file behavior changes.

## Capabilities

- Decide whether a database migration is needed.
- Choose the next `vYYMMDDN` migration prefix.
- Create focused migration files under `migrations/`.
- Register migrations in `app/Base/Migrator.php`.
- Keep file names and registration keys aligned.
- Report when migration execution itself was not performed.

## Not Supported

- Do not use this workflow for projects without `app/Base/Migrator.php`.
- Do not invent a migration runner or registration mechanism for non-SF projects.
- Do not modify dependency code or `vendor/` while preparing migrations.
- Do not execute migrations unless the user or local workflow explicitly asks for execution.

## Workflow

1. Confirm that a migration is actually needed and that the change belongs in `migrations/`.
2. Inspect existing migration files in `migrations/` and the registered groups in `app/Base/Migrator.php`.
3. Choose the next migration prefix in the `vYYMMDDN` format.
4. Create the migration file in `migrations/` with a descriptive suffix.
5. Register the migration in `app/Base/Migrator.php` under the matching index key.
6. If the index key does not exist yet, add it in the same change.
7. Keep the migration scope focused on one coherent schema or data change.
8. Mention if migration execution itself was not performed.

## Naming Rule

Migration files must use the prefix format `vYYMMDDN`, where:

- `YY` is the two-digit year
- `MM` is the month
- `DD` is the day
- `N` is the index for that day

Example for April 9, 2026:

- `v2604090`

Use the same prefix both for the file name and for the grouping key in `app/Base/Migrator.php`.

## Registration Rule

Every migration must also be registered in `app/Base/Migrator.php`.

- Add the migration class name without the `.php` suffix.
- Place it under the matching prefix key.
- If the required prefix key does not exist yet, add it as part of the same change.

## Practical Guidance

- Prefer descriptive suffixes such as `create_orders_table`, `update_pages_table`, or `seed_settings_table`.
- Before choosing the next prefix, check both `migrations/` and `app/Base/Migrator.php` so the file system and registration stay aligned.
- Do not modify `vendor/` or dependency code while preparing migrations.
- If the migration changes behavior that depends on translations, configs, or fixtures, update the related files in the same stage.

## Examples

Create a schema migration:

```text
migrations/v2604300_create_orders_table.php
app/Base/Migrator.php entry under v2604300
```

Create a seed migration:

```text
migrations/v2604301_seed_settings_table.php
app/Base/Migrator.php entry under v2604301
```

## Checklist

- The migration file is in `migrations/`.
- The prefix follows `vYYMMDDN`.
- The suffix is descriptive.
- The migration is registered in `app/Base/Migrator.php`.
- A missing prefix key was added when needed.

## Verification

The workflow is complete when the migration file exists under `migrations/`, the same `vYYMMDDN` prefix is present in `app/Base/Migrator.php`, the class name is registered without `.php`, related files were updated when the migration depends on them, and migration execution status was reported.
