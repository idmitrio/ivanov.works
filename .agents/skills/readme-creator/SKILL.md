---
name: readme-creator
description: Create or refresh an evidence-based Russian README.md. Use when a project needs verified setup, configuration, development, test, and deployment guidance.
---

# README Creator

## Purpose

Create or substantially refresh a root `README.md` as a practical entrypoint for the project's actual audience. Write in Russian by default unless the user requests another language or the repository has a clear convention worth preserving.

Use repository evidence before generic README conventions. Prefer accurate and concise over comprehensive.

## Safety And Boundaries

- Never invent commands, services, environment variables, deployment targets, or support policies.
- Never copy real tokens, passwords, keys, cookies, customer data, private hostnames, account-specific IDs, or machine-local paths.
- Document configuration from schemas, code, CI, and example files with placeholder values only.
- Do not replace specialized docs, API references, or runbooks with a giant README.
- Do not edit unrelated files, `AGENTS.md`, or `.agents/skills/` unless the user asks.
- Skills in `.agents/skills/` are auto-discovered. A README may link contributor workflows when useful, but it must not describe AGENTS registration as required.

## Workflow

1. Locate the root and read the existing `README.md` when present.
2. Inspect manifests, lockfiles, build scripts, CI, entrypoints, tests, configuration examples, migrations, deployment config, and focused existing docs.
3. Identify the audience: application developer, library consumer, CLI user, service operator, or maintainer.
4. Extract real install, run, test, lint, build, migration, generation, and deployment commands from executable sources.
5. Identify required services and configuration names without exposing values.
6. Preserve accurate existing structure and language; remove stale claims only after verifying the conflict.
7. Draft the smallest section set that lets the audience understand, configure, run, and verify the project.
8. Ask only when a missing fact changes an important command or behavior. Otherwise mark uncertainty briefly.
9. Verify commands, links, environment names, ordering, and Markdown.

Use [references/templates-and-checklists.md](references/templates-and-checklists.md) for audience-specific templates, reconnaissance checklists, examples, and common pitfalls. Load only the parts relevant to the repository.

## Section Selection

Choose sections by audience and verified evidence:

- applications usually need requirements, quick start, configuration, development, tests, and deployment/runbook links;
- libraries need installation, compatibility, minimal usage, public entrypoints, and versioning;
- CLIs need installation, common commands, inputs/outputs, configuration, and exit behavior;
- operator-facing services need health checks, migrations, logs, deployment, rollback links, and monitoring;
- internal tools need access prerequisites, supported workflow, ownership, and sensitive-data handling.

Do not create empty placeholders for sections that do not apply. Use a short TODO only for a real unresolved gap that readers must know about.

## Language And Style

- Use natural Russian engineering prose and conventional headings.
- Keep commands, paths, package names, config keys, flags, API names, identifiers, proper nouns, and error messages in their original spelling.
- Put the project name in the first heading and explain purpose and audience in one or two short paragraphs.
- Prefer exact copy-pastable commands in fenced blocks.
- Use repository-relative links for internal files.
- Omit empty or unsupported sections; do not add marketing filler.
- Keep deep architecture, troubleshooting, API details, and operational runbooks in their existing documents and link them.

## Existing README Rule

When updating:

- preserve useful project-specific content, established heading style, badges, screenshots, and links outside the requested scope;
- compare commands with current manifests, scripts, and CI before changing them;
- improve a strong custom structure in place instead of forcing a template;
- call out unresolved contradictions instead of silently choosing a guess.

## Configuration Sources

Prefer `.env.example`/`.env.sample`, config schemas, validation code, documented CI variables, Docker Compose services, and settings modules with placeholder defaults. Treat real `.env` files, credentials, dumps, and production config as sensitive even when locally readable.

## Verification

Before finishing, confirm that:

- every documented command exists or is explicitly labeled as an assumption;
- setup steps are in runnable order and prerequisites are named;
- links and referenced files exist;
- environment variable names match code or examples;
- no secret, private value, or machine-local path was copied;
- the chosen language and style match the request or repository convention;
- Markdown renders cleanly.

Run lightweight repository-specific checks when they materially validate the README. Do not run expensive builds or deployments solely for documentation unless the user asks.

Report the changed README path, the evidence used for important commands, checks performed, and any remaining assumptions or undocumented operational gaps.
