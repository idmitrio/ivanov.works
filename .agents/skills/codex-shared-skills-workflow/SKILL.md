---
name: codex-shared-skills-workflow
description: Synchronize managed Codex skills with the declarative updater. Use when a target project must connect, update, validate, migrate, or prune shared skills without changing local skills and overlays.
---

# Codex Shared Skills Workflow

## Operational Contract

Use `scripts/codex-skills.sh` to connect, update, validate, list, migrate, or prune skills selected in `codex-skills.json`.

The updater reads canonical `skill-manifest.json` files, resolves the complete dependency closure, stages changes, and writes ordered `selected` and `resolved` arrays to `codex-skills.lock`. Do not scan `SKILL.md` prose for dependencies or add resolved dependencies manually to the selected `skills` array.

Managed copies live beside unmanaged local skills under `.agents/skills/`. A directory is managed only when `.codex-shared-skill.json` is valid JSON, `schema_version` is `1`, `managed_by` is `codex-shared-skills`, and `skill` matches the directory basename.

## Files In Scope

- `codex-skills.json`: source, ref, selected shared skills, and local overlay mappings.
- `codex-skills.lock`: source commit plus ordered selected and resolved sets.
- `scripts/codex-skills.sh`: declarative updater copied from the canonical repository.
- `.agents/skills/`: managed copies and preserved unmanaged local skills.

`AGENTS.md` is not a discovery registry. Change it only when the user explicitly includes AGENTS cleanup or a repository-specific routing rule in scope.

## Safety And Collisions

- Never edit a valid managed copy directly; change its canonical source and sync.
- Never overwrite or prune an unmanaged directory, including one with an absent, invalid, foreign, or mismatched marker.
- Stop before writes when a selected shared skill collides with an unmanaged same-name destination.
- Stop before writes when both legacy `skills/<name>` and `.agents/skills/<name>` exist.
- Keep local overlays unmanaged. Map them through `codex-skills.json.local_overrides`; do not add overlay names to the managed `skills` array.
- Overlay paths must be repository-relative `.agents/skills/<overlay>/SKILL.md` files that exist.
- Do not change business code, product configuration, infrastructure, or unrelated files as part of synchronization.

## Workflow

1. Inspect `codex-skills.json`, `codex-skills.lock`, `scripts/codex-skills.sh`, `.agents/skills/`, and legacy `skills/` when present.
2. Copy or refresh `scripts/codex-skills.sh` from the canonical repository when connecting or upgrading the updater.
3. Update only the desired shared skill names in `codex-skills.json.skills`; keep project-specific mappings in `local_overrides`.
4. Run `sync --dry-run` and review every planned install, update, migration, prune, and collision.
5. If preview is safe, run one `sync --apply`. Let the updater resolve manifests and perform the transaction.
6. Run `validate` and `list`, then inspect the focused diff and `git status --short`.

For an explicit legacy layout migration, update override paths first and use `migrate-layout --dry-run` before `--apply`. Unrelated files remain under legacy `skills/`, and that directory is removed only when empty.

## Commands

```sh
./scripts/codex-skills.sh sync --dry-run
./scripts/codex-skills.sh sync --apply
./scripts/codex-skills.sh validate
./scripts/codex-skills.sh list
```

Explicit maintenance operations:

```sh
./scripts/codex-skills.sh migrate-layout --dry-run
./scripts/codex-skills.sh migrate-layout --apply
./scripts/codex-skills.sh prune --dry-run
./scripts/codex-skills.sh prune --apply
```

Review only setup changes:

```sh
git diff -- codex-skills.json codex-skills.lock scripts/codex-skills.sh .agents/skills
git status --short
```

## Verification

Completion requires:

- `validate` passes and `list` matches the intended selected/resolved state;
- `codex-skills.lock` records the source commit and ordered dependency closure;
- every managed copy has a valid matching marker;
- unmanaged local skills and overlay contents are unchanged;
- every `local_overrides` target exists in the flat `.agents/skills/<overlay>/SKILL.md` layout;
- no unrelated project file changed.

## Failure And Rollback

The updater must stop before target writes on invalid config, invalid or cyclic manifests, missing dependencies, source symlinks, nested skill roots, and ownership collisions. On apply failure it restores the pre-transaction managed state and lock file.

If verification fails:

1. Do not hand-edit managed directories to force success.
2. Preserve the error, dry-run output, and `git status --short`.
3. Fix the canonical manifest/config/collision cause.
4. Re-run preview, one apply, validation, and list.

If manual recovery is still required, restore only setup files from known repository history after showing the affected diff and obtaining any confirmation required by the target project's safety rules. Never delete an unmanaged directory as rollback.
