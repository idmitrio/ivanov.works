---
name: agents-md-creator
description: Create or refresh a compact repository-specific AGENTS.md. Use when verified commands, boundaries, safety rules, and workflow routing must become always-loaded instructions.
---

# AGENTS.md Creator

## Purpose

Create or substantially refresh a root `AGENTS.md` as a compact, always-loaded operational contract. Include only repository-specific rules that change agent behavior.

Prefer the smallest useful file. There is no minimum length; most projects should fit within about 80–100 lines, and many need less.

## Write Modes

- A direct request to create, write, update, refresh, or rewrite `AGENTS.md` authorizes writing the file after reconnaissance. Do not ask for a second confirmation.
- A request to propose, show, review, or draft content is draft-only. Show the proposed file and do not write it.
- When the user's intent is unclear, default to draft-only.

When updating an existing file, read it first and preserve accurate safety and project-specific workflow rules. Avoid wording churn that does not change behavior.

## Reconnaissance

Use targeted `rg --files`, `rg`, and focused reads. Inspect as applicable:

- existing `AGENTS.md` and `README.md`;
- manifests, lockfiles, build scripts, CI, tests, migrations, and deployment config;
- source entrypoints and generated/vendor/runtime boundaries;
- the hidden `.agents/skills/` directory, `codex-skills.json`, `codex-skills.lock`, and any legacy `skills/` migration input;
- relevant docs, runbooks, and schemas only when they affect normal agent work.

Collect verified facts about:

- ownership boundaries and files that must not be edited manually;
- real test, lint, build, migration, generation, and run commands;
- branch, commit, PR, release, issue, and migration workflows;
- secrets, customer data, destructive operations, production writes, and confirmation gates;
- large or noisy context that should remain on demand.

Do not invent commands, services, policies, or boundaries. If repository evidence conflicts, prefer executable scripts, manifests, and CI over stale prose and state the uncertainty.

## Clarification Rule

Ask 0–3 concise questions only when an answer materially changes the resulting file and cannot be inferred safely. Otherwise proceed with reasonable, stated assumptions.

Typical reasons to ask are an unknown destructive-action policy, mutually exclusive required test commands, or a genuine ownership ambiguity. Do not ask a fixed questionnaire.

## Content Contract

Include only what an agent needs across many tasks, such as:

- important code ownership and architecture boundaries;
- exact normal verification commands and when they apply;
- repository-specific coding or generated-file rules;
- explicit safety and confirmation requirements;
- concise workflow routing that changes execution.

Omit sections that add no rule. A `Skills` section is optional and should exist only when it adds real routing or safety meaning.

Do not include:

- README-style onboarding or an exhaustive directory tree;
- a full command catalog, architecture essay, or copied runbook;
- generic Codex guidance or implementation history;
- full skill descriptions or copied `SKILL.md` content;
- secrets, credentials, private environment values, customer data, logs, or dumps;
- large schemas, generated outputs, or lists of tools and integrations “just in case.”

Skills inside `.agents/skills/` are discovered automatically, including because `.agents` is hidden. Do not automatically enumerate managed, unmanaged, or overlay skills. Do not create a registry-only `Skills` section or managed block for discovery.

Mention a specific skill only inside an actual repository rule, such as routing release work or enforcing a safety gate. Machine-readable installation and overlay relationships belong in `codex-skills.json` and `local_overrides`, not in `AGENTS.md`.

## Workflow

1. Determine the repository root and write mode.
2. Read the existing file when present.
3. Perform focused reconnaissance, explicitly scanning `.agents/skills/` with hidden paths included.
4. Ask at most three material questions; ask none when evidence is sufficient.
5. Select only durable repository-specific rules and route long procedures to on-demand skills or references.
6. In draft-only mode, show the complete proposal plus assumptions.
7. In write mode, update `AGENTS.md`, preserving valid rules and removing obsolete registries or managed blocks when in scope.
8. Verify commands, links, safety content, and compactness; report the path and meaningful changes.

## Suggested Shape

Use only the headings that help:

```md
# Project Instructions

## Boundaries
## Commands
## Testing
## Safety
## Workflow
```

Natural repository-specific headings are preferable to forcing this template.

## Safety

- Never copy secrets, credentials, customer data, raw dumps, or machine-local private paths into `AGENTS.md`.
- Never weaken an existing destructive-action, production, deployment, migration, or data-handling gate without explicit user direction.
- Do not edit managed shared-skill copies while cleaning `AGENTS.md`; managed skills are updated through their canonical source and updater.
- Limit writes to `AGENTS.md` unless the user asks for supporting changes.

## Verification

Before finishing, confirm that:

- every documented command is verified or clearly marked as an assumption;
- internal links resolve;
- no registry-only skill list or obsolete managed block remains when cleanup is in scope;
- no skill inventory was introduced solely for discovery;
- no sensitive or machine-local data was copied;
- long workflows and catalogs remain on demand;
- Markdown is valid and the file is as compact as the repository allows.
