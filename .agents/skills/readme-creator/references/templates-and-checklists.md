# README Templates And Checklists

## Contents

- [Reconnaissance Checklist](#reconnaissance-checklist)
- [Default Russian Template](#default-russian-template)
- [Audience Variants](#audience-variants)
- [Examples](#examples)
- [Common Pitfalls](#common-pitfalls)

## Reconnaissance Checklist

Collect only items relevant to the project:

- project name from repository, package metadata, app title, or existing docs;
- project type and intended reader;
- main entrypoints and public interfaces;
- package manager, lockfile, runtime, and SDK requirements;
- dependency installation and local run commands;
- tests, lint, format, typecheck, build, migration, and generation commands;
- databases, queues, caches, browsers, containers, and external services;
- configuration file names and environment variable names;
- deployment or release commands explicitly documented in code or CI;
- license, contribution guide, support policy, and existing deeper docs;
- contributor workflows under `.agents/skills/` only when README readers need them.

Common evidence sources:

```text
package.json       pyproject.toml       composer.json
Cargo.toml         go.mod               Gemfile
Makefile           Dockerfile           compose.yaml
docker-compose.yml *.csproj             pubspec.yaml
.github/workflows/ .gitlab-ci.yml        tests/
.env.example       config/              migrations/
```

Useful focused discovery:

```bash
rg --files
rg "process.env|os.environ|getenv|ENV\\[|import.meta.env"
```

## Default Russian Template

Remove every section that lacks verified, useful content.

~~~~md
# Название проекта

Что делает проект и для кого он предназначен.

## Требования

- Runtime и версия
- Package manager
- Нужные локальные сервисы

## Быстрый старт

```bash
<install-command>
<configuration-step>
<run-command>
```

## Конфигурация

Перечень example-файлов и переменных без секретных значений.

## Разработка

```bash
<lint-command>
<build-command>
```

## Тестирование

```bash
<test-command>
```

## Структура проекта

Только важные entrypoints и ownership boundaries.

## Деплой

Только подтвержденный сценарий или ссылка на runbook.

## Лицензия

Название или ссылка на license-файл.
~~~~

## Audience Variants

### Application

Prioritize prerequisites, local services, configuration, startup, tests, migrations, and deployment links.

### Library

Prioritize installation, supported runtimes, minimal usage, public API entrypoint, compatibility, tests, and versioning.

### CLI

Prioritize installation, `--help`, common invocations, input/output formats, configuration, exit behavior, and examples.

### Service Operator

Prioritize required services, configuration, health checks, migrations, logs, safe deployment, rollback links, and monitoring.

### Internal Tool

Prioritize access prerequisites, supported workflow, local setup, sensitive-data handling, and where operational ownership lives. Do not imply public support or licensing.

## Examples

Create a new README:

```text
Inspect manifests, scripts, entrypoints, config examples, tests, and deployment docs. Create a concise Russian README with only verified setup and operating instructions.
```

Refresh an existing README:

```text
Compare README.md with current package scripts, Compose services, env examples, and CI. Correct stale commands while preserving useful structure and unrelated badges or links.
```

## Common Pitfalls

- Package scripts can hide service startup, migrations, or generated-file prerequisites; inspect their bodies.
- Docker Compose can reveal required services and ports absent from prose docs.
- CI may be the most reliable source for test, lint, build, and deployment commands.
- Monorepos may need a short root orientation plus per-package links, not copied instructions for every package.
- Internal projects may intentionally omit public license, contribution, or support sections.
- A TODO is useful only when it identifies a real documentation gap; it should not replace basic repository inspection.
