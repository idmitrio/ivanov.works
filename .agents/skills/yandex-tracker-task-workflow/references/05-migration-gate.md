# Phase 5: Pre-PR Migration Gate

Before starting PR creation, check whether the current branch added, renamed, or modified migrations relative to the PR target branch, usually `develop`:

```bash
git diff --name-status develop...HEAD -- migrations/
```

If the target branch is not `develop`, use the actual PR target.

If there are no changed files under `migrations/`, record that in `Codex State` and continue to PR creation.

If there are migration changes:

1. Apply [sf-migration-workflow](../../sf-migration-workflow/SKILL.md) to inspect changed migration filenames and `app/Base/Migrator.php` registration.
2. Extract the migration index from every changed migration class/file prefix in `vYYMMDDN` format.
3. Ensure all branch migrations use one shared index. If they use different indexes, consolidate them:
   - choose the newest or otherwise correct branch index according to [sf-migration-workflow](../../sf-migration-workflow/SKILL.md);
   - rename migration files and class names to that shared prefix;
   - update `app/Base/Migrator.php` so renamed classes are registered under the matching key;
   - remove old branch-only registration keys when they were created only for this branch.
4. If more than one changed settings seed migration matches `migrations/*seed_settings_table.php`, apply [sf-settings-workflow](../../sf-settings-workflow/SKILL.md) and merge them into a single seed migration under the shared index.
5. Run focused verification after consolidation, at minimum:
   - `php -l` for every changed PHP migration file;
   - diff review of renamed files and `app/Base/Migrator.php`;
   - focused project checks needed for touched settings code.
6. If consolidation changed files, self-review, ask the user to accept this separate stage, then commit it before PR creation.
7. Update `Codex State` with the migration consolidation result. Include the commit hash if files changed; if no consolidation was needed, record the check without a commit hash.
8. If consolidation changed files after successful review-gate, repeat review-gate on affected files before PR creation.

Do not create the PR or move the issue to `Тестируется` until migration indexes, settings seed migrations, and `app/Base/Migrator.php` registration are consistent.

Use the `Codex State` template from [comment-templates.md](comment-templates.md) for pre-PR migration gate results.
