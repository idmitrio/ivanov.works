---
name: sf-settings-workflow
description: Add new application settings to Smartofood-style projects, including seed migration, SettingsService formatting and saving behavior when present, DbSettings accessors, and settings templates.
---

# SF Settings Workflow

## Overview

Use this skill when adding a new setting to a Smartofood-style repository. A complete setting usually has four parts:

1. A seed migration that inserts the setting key into `settings`.
2. Formatting, filtering, and optional save behavior in the project's `SettingsService.php`, when present.
3. A typed getter in `app/Base/DbSettings.php`.
4. Placement in the relevant settings template under `templates/`, when present.

Use [sf-migration-workflow](../sf-migration-workflow/SKILL.md) for migration naming and `app/Base/Migrator.php` registration.

This skill assumes the project stores settings in a `settings` table, uses seed migrations, and has Smartofood-style settings accessors and optional settings UI/API layers. If those structures are absent, use a project-local settings workflow instead.

## Recommended Reasoning

Default: `high`

Use `high` for normal settings work because the workflow can touch seed migrations, formatting and save behavior, typed accessors, templates, translations, and optional API surfaces. Use `xhigh` when settings are secret, encrypted, exposed through public APIs, tied to permissions, payments, authentication, external integrations, or production-critical runtime behavior.

## Capabilities

- Clarify setting key, default value, type, title, settings page, and runtime consumer.
- Add a seed migration for the new setting.
- Register the migration through [sf-migration-workflow](../sf-migration-workflow/SKILL.md).
- Add `SettingsService` formatting, filtering, and save behavior when the project has that service.
- Add typed `DbSettings` accessors.
- Add panel template entries and translations when the project has those surfaces.
- Update settings API and API docs only when the setting must be exposed.

## Not Supported

- Do not use this workflow for projects without Smartofood-style settings storage.
- Do not expose internal settings through an API unless the task requires exposure.
- Do not add UI, translation, or OpenAPI changes when the target project does not have those surfaces.
- Do not hardcode secrets; use encrypted save behavior when local settings patterns require it.

## Workflow

1. Clarify the setting key, default value, type, title, target settings page, and runtime consumer.
2. Inspect similar existing settings before editing:
   - `migrations/*seed_settings_table.php`
   - `SettingsService.php` found under `app/`
   - `app/Base/DbSettings.php`
   - settings templates found under `templates/`, especially files named `settings.php`
   - specialized settings templates under `templates/` when they exist
3. Create a focused `migrations/vYYMMDDN_seed_settings_table.php` migration with `Schema::fill('settings', $rows)`.
4. Register the migration in `app/Base/Migrator.php` using the migration workflow skill.
5. Locate the project's `SettingsService.php` under `app/`. If it exists, add the setting to `SettingsService::format()` so the UI knows the display name, formatted value, raw value, input type, default value, and optional metadata.
6. If `SettingsService.php` exists, add `SettingsService::filter()` rules when the setting needs normalization, character restrictions, length limits, numeric bounds, or custom ordering.
7. If `SettingsService.php` exists, update `SettingsService::save()` only when the setting needs special persistence behavior:
   - add sensitive values to `$secretKeys` so they are encrypted and hidden in change logs;
   - add array-backed values to `$arrayKeys`;
   - add relation updates, cache/menu events, or other side effects only when required.
8. Add a method to `app/Base/DbSettings.php` close to related accessors. Return the natural PHP type (`bool`, `int`, `?int`, `string`, or structured data) and pass the same default used by the seed/format layer.
9. Add the setting key to the relevant settings template card when the project has settings templates:
   - search for files named `settings.php` under `templates/`;
   - inspect nearby specialized settings templates under `templates/` when they exist;
   - settings with custom UI or actions may need a separate block instead of a card entry.
10. If the project has a client API and the setting must be exposed there, locate the controller/action that returns settings and update that implementation.
11. If the setting is returned by a documented API and OpenAPI docs exist, update the matching schema file.
12. If the project has `i18n` translation files, add translations for every new Russian user-facing string and append new translation lines to the end of translation files.

## Seed Migration Pattern

Settings seed migrations in this repository are small data migrations:

```php
<?php


use Ivanov\SchemaBuilder\Schema;

class v2604070_seed_settings_table extends \Ivanov\Migrations\Seeder
{

    public function run():void
    {
        $rows = [
            ['key' => 'SITE_EXAMPLE_SETTING', 'value' => '0'],
        ];

        Schema::fill('settings', $rows);
    }
}
```

Keep one coherent group of settings per seed migration. Use an empty string for blank text defaults and string values such as `'0'` or `'1'` for boolean defaults.

## SettingsService Checklist

First locate `SettingsService.php` under `app/`. If the project does not have a settings service, skip this section and follow the project's existing settings formatting pattern instead.

In `SettingsService::format()`, return the same structure used by existing settings:

- `name`: translated panel label.
- `value`: formatted display value, for example `$formatter->asBool($value)`, `$formatter->asInteger($value)`, `$formatter->asText($value)`, or `$formatter->asMaskedText($value)`.
- `raw`: raw editable value.
- `type`: one of the existing panel editor types such as `bool`, `string`, `number`, `text`, `select`, or `multiple`.
- `default`: default value as a string.
- `data`: select/multiple options when needed.
- `required`, `hint`, `desc`, `border`, `related`, or `related_data`: only when matching existing behavior.

Add `filter()` handling when default quote stripping is not enough. Examples in the codebase include numeric-only keys, comma-separated IDs, uppercase limited prefixes, bounded numbers, and ordered lists such as `SITE_AUTH_PRIORITY`.

For secrets, decrypt in `format()` before exposing `raw`, display with `$formatter->asMaskedText()`, and add the key to `$secretKeys` in `save()` so the stored value is encrypted and changes are filtered.

## DbSettings Checklist

Add a named method instead of scattering raw setting keys through business logic. Follow nearby method names:

- `is...():bool` for enabled flags.
- `get...():string` for text/identifier settings.
- `get...():int` or `get...():?int` for numeric settings.

Use `$this->get('SETTING_KEY', 'default')` and cast deliberately. For encrypted settings, decrypt inside the accessor when callers need the plaintext value.

## Client API Checklist

This section is optional. Some projects expose site settings through a client API, and some do not.

When API exposure is required:

- search under `app/` for controllers or actions that return settings;
- inspect existing settings response shaping before editing;
- update the controller/action that actually owns the settings payload.

When the new setting must be visible to API clients and a settings API exists:

- make sure it is included in the data collected by `SettingsService::getSiteSettings()` or explicitly added in `actionSettings()`;
- add the key to the local type conversion lists when needed, such as `$bool`, `$int`, `$comma`, or `$eol`;
- do not add it to `$skip`.

When the new setting must stay internal, add it to the relevant `$skip` list only when the project has a settings API payload source that could otherwise expose it.

If the setting is returned by a documented API, update the matching OpenAPI schema when the project has one. Do not assume the docs file is named `docs/client-api-v1.yaml`.

## Panel Template Checklist

First search for settings templates under `templates/`. Start with files named `settings.php`, then inspect specialized settings templates if they exist.

Most settings only need their key appended to the correct `$cards` group in the relevant settings template. The template usually renders keys from `$settings` after formatting by the project's settings service.

Use a custom block when the setting is not a normal editable value. Find an existing custom settings block in `templates/` and follow that local pattern.

## i18n Checklist

This section is optional. If the project has `i18n` translation files, append translations for new user-facing strings to the relevant files. If the project does not have `i18n`, continue without translation edits.

## Examples

Boolean setting exposed in panel only:

```text
Key: SITE_ENABLE_EXAMPLE
Default: 0
Type: bool
Required updates: seed migration, DbSettings::isExampleEnabled(), SettingsService format/filter when present, panel settings template
```

Internal numeric setting:

```text
Key: SITE_EXAMPLE_LIMIT
Default: 10
Type: int
Required updates: seed migration, DbSettings::getExampleLimit()
API exposure: no
```

## Review Checklist

- Migration is created and registered.
- `SettingsService::format()` includes a panel representation when the project has `SettingsService.php`.
- `SettingsService::filter()` or `save()` is updated for validation, encryption, arrays, or side effects when needed and when the project has that service.
- `DbSettings` exposes the setting through a typed method.
- The setting appears in the correct settings template or specialized custom block when the project has settings templates.
- The settings API implementation is updated when the project has one and the setting must be exposed or explicitly hidden.
- API docs are updated when the project has matching docs and the API returns the setting.
- New translated text is appended to translation files when the project has `i18n`.

## Verification

The workflow is complete when the setting is seeded and registered, `DbSettings` exposes a typed accessor, optional UI/API/docs/translations were updated only where applicable, sensitive or structured values follow local save/filter patterns, and migration execution status was reported when a migration was created.
