#!/usr/bin/env bash
set -euo pipefail

CODEX_SKILLS_VERSION="2.1.0"
export CODEX_SKILLS_VERSION
export CODEX_SKILLS_SCRIPT_PATH="${BASH_SOURCE[0]}"

exec python3 - "$@" <<'PY'
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Iterable


VERSION = os.environ["CODEX_SKILLS_VERSION"]
LOCK_SCHEMA_VERSION = 2
MANIFEST_SCHEMA_VERSION = 1
SKILL_ROOT_RELATIVE = Path(".agents/skills")
MARKER_NAME = ".codex-shared-skill.json"
MANAGED_BY = "codex-shared-skills"
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


class CodexSkillsError(RuntimeError):
    pass


def die(message: str) -> None:
    raise CodexSkillsError(message)


def read_json(path: Path, label: str) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        die(f"missing {label}: {path}")
    except (OSError, json.JSONDecodeError) as exc:
        die(f"invalid {label} {path}: {exc}")


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def validate_name(name: Any, label: str = "skill name") -> str:
    if not isinstance(name, str) or not NAME_RE.fullmatch(name):
        die(f"invalid {label}: {name!r}")
    return name


def reject_root_symlink(path: Path, label: str, *, allow_missing: bool = False) -> None:
    if path.is_symlink():
        die(f"refusing symlinked {label}: {path}")
    if not path.exists():
        if allow_missing:
            return
        die(f"missing {label}: {path}")
    if not path.is_dir():
        die(f"{label} is not a directory: {path}")


def reject_tree_symlinks(root: Path, label: str) -> None:
    reject_root_symlink(root, label)
    for current, directories, files in os.walk(root, followlinks=False):
        base = Path(current)
        for name in [*directories, *files]:
            candidate = base / name
            if candidate.is_symlink():
                die(f"refusing symlink in {label}: {candidate}")


def validate_no_nested_skill(skill_dir: Path, name: str) -> None:
    for nested in skill_dir.rglob("SKILL.md"):
        if nested != skill_dir / "SKILL.md":
            die(f"nested skill root in '{name}': {nested}")


def marker_data(skill_dir: Path, name: str) -> dict[str, Any] | None:
    marker = skill_dir / MARKER_NAME
    if not marker.is_file() or marker.is_symlink():
        return None
    try:
        data = json.loads(marker.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    if (
        data.get("schema_version") != 1
        or data.get("managed_by") != MANAGED_BY
        or data.get("skill") != name
    ):
        return None
    return data


def validate_manifest(skill_dir: Path, name: str) -> list[str]:
    manifest_path = skill_dir / "skill-manifest.json"
    if not manifest_path.is_file() or manifest_path.is_symlink():
        die(f"skill '{name}' is missing regular skill-manifest.json")
    data = read_json(manifest_path, f"manifest for skill '{name}'")
    if not isinstance(data, dict) or set(data) != {"schema_version", "requires"}:
        die(f"skill '{name}' manifest must contain only schema_version and requires")
    if data["schema_version"] != MANIFEST_SCHEMA_VERSION:
        die(
            f"skill '{name}' has unsupported manifest schema_version "
            f"{data['schema_version']!r}"
        )
    requires = data["requires"]
    if not isinstance(requires, list):
        die(f"skill '{name}' manifest requires must be an array")
    result: list[str] = []
    for dependency in requires:
        dependency = validate_name(dependency, f"dependency in '{name}'")
        if dependency in result:
            die(f"skill '{name}' manifest contains duplicate dependency '{dependency}'")
        result.append(dependency)
    return result


def validate_skill_dir(
    skill_dir: Path,
    name: str,
    *,
    require_manifest: bool,
    require_valid_marker: bool = False,
) -> list[str]:
    validate_name(name)
    reject_tree_symlinks(skill_dir, f"skill '{name}'")
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.is_file() or skill_md.is_symlink():
        die(f"skill '{name}' is missing regular SKILL.md")
    validate_no_nested_skill(skill_dir, name)
    if require_valid_marker and marker_data(skill_dir, name) is None:
        die(f"skill '{name}' has an invalid {MARKER_NAME} marker")
    manifest = skill_dir / "skill-manifest.json"
    if require_manifest or manifest.exists() or manifest.is_symlink():
        return validate_manifest(skill_dir, name)
    return []


class Source:
    def __init__(self, source: str, ref: str, temp_root: Path):
        self.source_value = source
        self.ref = ref
        self.temp_root = temp_root
        self.root: Path | None = None
        self.commit = ""

    def resolve(self) -> Path:
        if self.root is not None:
            return self.root
        local = Path(self.source_value).expanduser()
        if local.is_dir():
            reject_root_symlink(local, "source root")
            self.root = local.resolve()
        else:
            if shutil.which("git") is None:
                die(f"git is required to fetch source '{self.source_value}'")
            destination = self.temp_root / "source"
            result = subprocess.run(
                ["git", "clone", "--quiet", self.source_value, str(destination)],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if result.returncode != 0:
                die(f"failed to clone {self.source_value}: {result.stderr.strip()}")
            result = subprocess.run(
                ["git", "-C", str(destination), "checkout", "--quiet", self.ref],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if result.returncode != 0:
                die(
                    f"failed to checkout {self.ref} from {self.source_value}: "
                    f"{result.stderr.strip()}"
                )
            self.root = destination.resolve()
        reject_root_symlink(self.root, "source root")
        reject_root_symlink(self.root / ".agents", "source .agents")
        reject_root_symlink(self.root / SKILL_ROOT_RELATIVE, "source skill root")
        self.commit = self._commit()
        return self.root

    def _commit(self) -> str:
        assert self.root is not None
        result = subprocess.run(
            ["git", "-C", str(self.root), "rev-parse", "HEAD"],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        return f"local-no-git:{self.ref}"

    @property
    def skills_root(self) -> Path:
        return self.resolve() / SKILL_ROOT_RELATIVE


def parse_config(path: Path) -> dict[str, Any]:
    data = read_json(path, "codex-skills.json")
    if not isinstance(data, dict):
        die("codex-skills.json must be an object")
    source = data.get("source")
    ref = data.get("ref")
    selected = data.get("skills")
    overrides = data.get("local_overrides", {})
    if not isinstance(source, str) or not source:
        die("codex-skills.json source must be a non-empty string")
    if not isinstance(ref, str) or not ref:
        die("codex-skills.json ref must be a non-empty string")
    if not isinstance(selected, list) or not selected:
        die("codex-skills.json skills must be a non-empty array")
    normalized: list[str] = []
    for name in selected:
        name = validate_name(name)
        if name in normalized:
            die(f"codex-skills.json contains duplicate selected skill '{name}'")
        normalized.append(name)
    if not isinstance(overrides, dict):
        die("codex-skills.json local_overrides must be an object")
    normalized_overrides: dict[str, str] = {}
    for skill, path_value in overrides.items():
        skill = validate_name(skill, "local_overrides key")
        if not isinstance(path_value, str):
            die(f"local_overrides.{skill} must be a string")
        match = re.fullmatch(r"\.agents/skills/([a-z0-9][a-z0-9-]*)/SKILL\.md", path_value)
        if not match:
            die(
                f"local_overrides.{skill} must point to "
                ".agents/skills/<overlay>/SKILL.md"
            )
        normalized_overrides[skill] = path_value
    return {
        "source": source,
        "ref": ref,
        "selected": normalized,
        "local_overrides": normalized_overrides,
    }


def resolve_dependencies(source: Source, selected: list[str]) -> list[str]:
    skills_root = source.skills_root
    resolved: list[str] = []
    visiting: list[str] = []
    manifests: dict[str, list[str]] = {}

    def visit(name: str, parent: str | None = None) -> None:
        skill_dir = skills_root / name
        if not skill_dir.is_dir() or skill_dir.is_symlink():
            if parent:
                die(f"skill '{parent}' requires missing dependency '{name}'")
            die(f"selected skill '{name}' does not exist in source")
        if name in visiting:
            start = visiting.index(name)
            cycle = " -> ".join([*visiting[start:], name])
            die(f"dependency cycle detected: {cycle}")
        if name in resolved:
            return
        if name not in manifests:
            manifests[name] = validate_skill_dir(
                skill_dir, name, require_manifest=True
            )
        visiting.append(name)
        for dependency in manifests[name]:
            visit(dependency, name)
        visiting.pop()
        resolved.append(name)

    for name in selected:
        visit(name)
    return resolved


def validate_destination_roots(project_root: Path) -> None:
    reject_root_symlink(project_root, "project root")
    reject_root_symlink(project_root / ".agents", "destination .agents", allow_missing=True)
    reject_root_symlink(
        project_root / SKILL_ROOT_RELATIVE,
        "destination skill root",
        allow_missing=True,
    )
    skills_root = project_root / SKILL_ROOT_RELATIVE
    if skills_root.exists():
        reject_tree_symlinks(skills_root, "destination skill root")
        for entry in sorted(skills_root.iterdir(), key=lambda item: item.name):
            if not entry.is_dir():
                continue
            validate_skill_dir(
                entry,
                entry.name,
                require_manifest=False,
            )
    legacy = project_root / "skills"
    reject_root_symlink(legacy, "legacy skill root", allow_missing=True)
    if legacy.exists():
        reject_tree_symlinks(legacy, "legacy skill root")


def legacy_candidates(project_root: Path) -> list[tuple[str, Path, bool]]:
    legacy = project_root / "skills"
    if not legacy.exists():
        return []
    candidates: list[tuple[str, Path, bool]] = []
    for entry in sorted(legacy.iterdir(), key=lambda item: item.name):
        if not entry.is_dir():
            continue
        name = validate_name(entry.name)
        managed = marker_data(entry, name) is not None
        if not (entry / "SKILL.md").is_file() and not managed:
            continue
        validate_skill_dir(
            entry,
            name,
            require_manifest=False,
            require_valid_marker=managed,
        )
        candidates.append((name, entry, managed))
    return candidates


def check_override_targets(
    project_root: Path,
    overrides: dict[str, str],
    candidates: Iterable[tuple[str, Path, bool]],
) -> None:
    legacy_names = {name for name, _, _ in candidates}
    for skill, relative in overrides.items():
        target = project_root / relative
        overlay_name = Path(relative).parent.name
        if target.is_file() and not target.is_symlink():
            continue
        legacy_target = project_root / "skills" / overlay_name / "SKILL.md"
        if overlay_name in legacy_names and legacy_target.is_file() and not legacy_target.is_symlink():
            continue
        die(f"local override for '{skill}' points to missing file: {relative}")


def preflight_conflicts(
    project_root: Path,
    resolved: list[str],
    candidates: list[tuple[str, Path, bool]],
) -> tuple[list[str], list[str]]:
    skills_root = project_root / SKILL_ROOT_RELATIVE
    candidate_names = {name for name, _, _ in candidates}
    if len(candidate_names) != len(candidates):
        die("duplicate legacy skill names")
    for name in candidate_names:
        destination = skills_root / name
        if destination.exists():
            die(
                f"legacy migration collision for '{name}': both ./skills/{name} and "
                f"./.agents/skills/{name} exist; no files were changed"
            )
    for name in resolved:
        destination = skills_root / name
        if destination.exists() and marker_data(destination, name) is None:
            die(
                f"refusing to overwrite unmanaged local skill "
                f"./.agents/skills/{name}"
            )
        for legacy_name, _, managed in candidates:
            if legacy_name == name and not managed:
                die(f"refusing to overwrite unmanaged legacy skill ./skills/{name}")
    managed_existing: list[str] = []
    if skills_root.exists():
        for entry in sorted(skills_root.iterdir(), key=lambda item: item.name):
            if marker_data(entry, entry.name) is not None:
                managed_existing.append(entry.name)
    stale = [name for name in managed_existing if name not in resolved]
    return managed_existing, stale


def marker(source: Source, name: str) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "managed_by": MANAGED_BY,
        "source": source.source_value,
        "ref": source.ref,
        "commit": source.commit,
        "skill": name,
    }


def build_lock(config: dict[str, Any], source: Source, resolved: list[str]) -> dict[str, Any]:
    return {
        "schema_version": LOCK_SCHEMA_VERSION,
        "source": config["source"],
        "ref": config["ref"],
        "commit": source.commit,
        "selected": config["selected"],
        "resolved": resolved,
    }


def stage_sync(
    stage_root: Path,
    source: Source,
    resolved: list[str],
    candidates: list[tuple[str, Path, bool]],
    lock_data: dict[str, Any],
) -> tuple[Path, Path, Path]:
    staged_skills = stage_root / "resolved"
    staged_migrations = stage_root / "migrations"
    staged_skills.mkdir(parents=True)
    staged_migrations.mkdir(parents=True)
    for name in resolved:
        src = source.skills_root / name
        destination = staged_skills / name
        shutil.copytree(src, destination)
        write_json(destination / MARKER_NAME, marker(source, name))
        validate_skill_dir(
            destination,
            name,
            require_manifest=True,
            require_valid_marker=True,
        )
    for name, legacy, managed in candidates:
        if managed or name in resolved:
            continue
        destination = staged_migrations / name
        shutil.copytree(legacy, destination)
        validate_skill_dir(destination, name, require_manifest=False)
    staged_lock = stage_root / "codex-skills.lock"
    write_json(staged_lock, lock_data)
    if read_json(staged_lock, "staged lock") != lock_data:
        die("staged lock read-back verification failed")
    return staged_skills, staged_migrations, staged_lock


def atomic_restore_lock(lock_file: Path, backup: Path | None) -> None:
    if backup is None:
        lock_file.unlink(missing_ok=True)
        return
    restore = lock_file.with_name(f".{lock_file.name}.rollback")
    shutil.copy2(backup, restore)
    os.replace(restore, lock_file)


def failpoint(name: str) -> None:
    if (
        os.environ.get("CODEX_SKILLS_TESTING") == "1"
        and os.environ.get("CODEX_SKILLS_FAILPOINT") == name
    ):
        die(f"injected test failure at {name}")


def verify_sync(
    project_root: Path,
    source: Source,
    config: dict[str, Any],
    resolved: list[str],
    stale: list[str],
    lock_data: dict[str, Any],
) -> None:
    skills_root = project_root / SKILL_ROOT_RELATIVE
    for name in resolved:
        destination = skills_root / name
        validate_skill_dir(
            destination,
            name,
            require_manifest=True,
            require_valid_marker=True,
        )
        if marker_data(destination, name) != marker(source, name):
            die(f"marker read-back verification failed for '{name}'")
        source_manifest = (source.skills_root / name / "skill-manifest.json").read_bytes()
        if (destination / "skill-manifest.json").read_bytes() != source_manifest:
            die(f"manifest read-back verification failed for '{name}'")
    for name in stale:
        if (skills_root / name).exists():
            die(f"managed prune read-back verification failed for '{name}'")
    lock_file = project_root / "codex-skills.lock"
    if read_json(lock_file, "codex-skills.lock") != lock_data:
        die("lock read-back verification failed")
    check_override_targets(project_root, config["local_overrides"], [])


def apply_sync(
    project_root: Path,
    temp_root: Path,
    source: Source,
    config: dict[str, Any],
    resolved: list[str],
    candidates: list[tuple[str, Path, bool]],
    stale: list[str],
    staged_skills: Path,
    staged_migrations: Path,
    staged_lock: Path,
    lock_data: dict[str, Any],
) -> None:
    skills_root = project_root / SKILL_ROOT_RELATIVE
    legacy_root = project_root / "skills"
    lock_file = project_root / "codex-skills.lock"
    backup_root = temp_root / "rollback"
    target_backup = backup_root / "target"
    legacy_backup = backup_root / "legacy"
    target_backup.mkdir(parents=True)
    legacy_backup.mkdir(parents=True)
    old_lock = backup_root / "codex-skills.lock" if lock_file.exists() else None
    if old_lock is not None:
        shutil.copy2(lock_file, old_lock)

    backed_targets: list[str] = []
    new_targets: list[str] = []
    backed_legacy: list[str] = []
    touched = list(dict.fromkeys([*resolved, *stale]))
    try:
        skills_root.mkdir(parents=True, exist_ok=True)
        for name in touched:
            destination = skills_root / name
            if destination.exists():
                os.replace(destination, target_backup / name)
                backed_targets.append(name)
        for name in resolved:
            os.replace(staged_skills / name, skills_root / name)
            new_targets.append(name)
        for name, _, managed in candidates:
            if managed or name in resolved:
                continue
            os.replace(staged_migrations / name, skills_root / name)
            new_targets.append(name)
        failpoint("after-target-replace")
        for name, legacy, _ in candidates:
            os.replace(legacy, legacy_backup / name)
            backed_legacy.append(name)
        failpoint("before-lock-replace")
        os.replace(staged_lock, lock_file)
        failpoint("after-lock-replace")
        verify_sync(project_root, source, config, resolved, stale, lock_data)
        if legacy_root.exists():
            try:
                legacy_root.rmdir()
            except OSError:
                pass
    except BaseException as exc:
        rollback_errors: list[str] = []
        for name in reversed(new_targets):
            try:
                shutil.rmtree(skills_root / name)
            except FileNotFoundError:
                pass
            except OSError as rollback_exc:
                rollback_errors.append(str(rollback_exc))
        for name in reversed(backed_targets):
            try:
                os.replace(target_backup / name, skills_root / name)
            except OSError as rollback_exc:
                rollback_errors.append(str(rollback_exc))
        legacy_root.mkdir(parents=True, exist_ok=True)
        for name in reversed(backed_legacy):
            try:
                os.replace(legacy_backup / name, legacy_root / name)
            except OSError as rollback_exc:
                rollback_errors.append(str(rollback_exc))
        try:
            atomic_restore_lock(lock_file, old_lock)
        except OSError as rollback_exc:
            rollback_errors.append(str(rollback_exc))
        if rollback_errors:
            raise CodexSkillsError(
                f"transaction failed ({exc}); rollback errors: {'; '.join(rollback_errors)}"
            ) from exc
        raise


def operation_context(project_root: Path, config: dict[str, Any], temp_root: Path):
    validate_destination_roots(project_root)
    source = Source(config["source"], config["ref"], temp_root)
    source_root = source.resolve()
    destination_root = (project_root / SKILL_ROOT_RELATIVE).resolve(strict=False)
    source_skill_root = source.skills_root.resolve()
    if source_skill_root == destination_root:
        die("source and destination skill roots must be different")
    if source_skill_root in destination_root.parents or destination_root in source_skill_root.parents:
        die("nested source and destination skill roots are not allowed")
    resolved = resolve_dependencies(source, config["selected"])
    candidates = legacy_candidates(project_root)
    check_override_targets(project_root, config["local_overrides"], candidates)
    _, stale = preflight_conflicts(project_root, resolved, candidates)
    return source, resolved, candidates, stale


def cmd_sync(project_root: Path, mode: str) -> None:
    config_file = project_root / "codex-skills.json"
    config = parse_config(config_file)
    with tempfile.TemporaryDirectory(prefix="codex-skills-") as temp:
        temp_root = Path(temp)
        source, resolved, candidates, stale = operation_context(
            project_root, config, temp_root
        )
        lock_data = build_lock(config, source, resolved)
        staged = stage_sync(
            temp_root / "staging", source, resolved, candidates, lock_data
        )
        print("selected: " + ", ".join(config["selected"]))
        print("resolved: " + ", ".join(resolved))
        for name in stale:
            print(f"prune managed: {name}")
        for name, _, _ in candidates:
            print(f"migrate legacy: {name}")
        if mode == "dry-run":
            print("dry-run: no files changed")
            return
        apply_sync(
            project_root,
            temp_root,
            source,
            config,
            resolved,
            candidates,
            stale,
            *staged,
            lock_data,
        )
        print("sync applied transactionally")


def cmd_migrate_layout(project_root: Path, mode: str) -> None:
    validate_destination_roots(project_root)
    candidates = legacy_candidates(project_root)
    skills_root = project_root / SKILL_ROOT_RELATIVE
    for name, _, _ in candidates:
        if (skills_root / name).exists():
            die(f"legacy migration collision for '{name}'; no files were changed")
    overrides: dict[str, str] = {}
    config_file = project_root / "codex-skills.json"
    if config_file.exists():
        overrides = parse_config(config_file)["local_overrides"]
        check_override_targets(project_root, overrides, candidates)
    for name, _, managed in candidates:
        print(f"migrate {'managed' if managed else 'unmanaged'}: {name}")
    if not candidates:
        print("legacy layout is already clean")
        return
    if mode == "dry-run":
        print("dry-run: no files changed")
        return
    moved: list[str] = []
    skills_root.mkdir(parents=True, exist_ok=True)
    try:
        for name, legacy, _ in candidates:
            os.replace(legacy, skills_root / name)
            moved.append(name)
            failpoint("during-layout-migration")
        check_override_targets(project_root, overrides, [])
        legacy_root = project_root / "skills"
        try:
            legacy_root.rmdir()
        except OSError:
            pass
    except BaseException:
        legacy_root = project_root / "skills"
        legacy_root.mkdir(parents=True, exist_ok=True)
        for name in reversed(moved):
            os.replace(skills_root / name, legacy_root / name)
        raise
    print("layout migration applied transactionally")


def cmd_prune(project_root: Path, mode: str) -> None:
    config = parse_config(project_root / "codex-skills.json")
    with tempfile.TemporaryDirectory(prefix="codex-skills-") as temp:
        temp_root = Path(temp)
        source, resolved, candidates, stale = operation_context(
            project_root, config, temp_root
        )
        del source, candidates
        if not stale:
            print("no stale managed skills")
            return
        for name in stale:
            print(f"prune managed: {name}")
        if mode == "dry-run":
            print("dry-run: no files changed")
            return
        skills_root = project_root / SKILL_ROOT_RELATIVE
        backup = temp_root / "prune-backup"
        backup.mkdir()
        moved: list[str] = []
        try:
            for name in stale:
                os.replace(skills_root / name, backup / name)
                moved.append(name)
                failpoint("during-prune")
            for name in stale:
                if (skills_root / name).exists():
                    die(f"prune read-back verification failed for '{name}'")
        except BaseException:
            for name in reversed(moved):
                os.replace(backup / name, skills_root / name)
            raise
        print("managed prune applied transactionally")


def cmd_validate(project_root: Path) -> None:
    validate_destination_roots(project_root)
    config_file = project_root / "codex-skills.json"
    if config_file.exists():
        config = parse_config(config_file)
        with tempfile.TemporaryDirectory(prefix="codex-skills-") as temp:
            source, resolved, candidates, _ = operation_context(
                project_root, config, Path(temp)
            )
            del source
            check_override_targets(project_root, config["local_overrides"], candidates)
            print("selected: " + ", ".join(config["selected"]))
            print("resolved: " + ", ".join(resolved))
    else:
        skills_root = project_root / SKILL_ROOT_RELATIVE
        if not skills_root.exists():
            die(f"missing skill root: {SKILL_ROOT_RELATIVE}")
        for entry in sorted(skills_root.iterdir(), key=lambda item: item.name):
            if not entry.is_dir():
                continue
            validate_skill_dir(entry, entry.name, require_manifest=True)
    print("validation passed")


def cmd_check(project_root: Path) -> None:
    validator = (
        project_root
        / SKILL_ROOT_RELATIVE
        / "repo-skill-creator"
        / "scripts"
        / "quick_validate.py"
    )
    if not validator.is_file() or validator.is_symlink():
        die(f"missing canonical repository validator: {validator}")
    env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
    commands = [
        [sys.executable, str(validator), "--all", str(project_root)],
        [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"],
    ]
    for command in commands:
        result = subprocess.run(command, cwd=project_root, env=env)
        if result.returncode:
            die(f"repository check command failed ({result.returncode}): {' '.join(command)}")
    print("repository check passed")


def cmd_list(project_root: Path) -> None:
    config_file = project_root / "codex-skills.json"
    if config_file.exists():
        for name in parse_config(config_file)["selected"]:
            print(name)
        return
    skills_root = project_root / SKILL_ROOT_RELATIVE
    reject_root_symlink(skills_root, "destination skill root")
    for entry in sorted(skills_root.iterdir(), key=lambda item: item.name):
        if entry.is_dir() and not entry.is_symlink():
            print(entry.name)


def source_script_version(path: Path) -> str:
    if not path.is_file() or path.is_symlink():
        die(f"source updater is missing or symlinked: {path}")
    match = re.search(
        r'^CODEX_SKILLS_VERSION="([^"]+)"$',
        path.read_text(encoding="utf-8"),
        re.MULTILINE,
    )
    if not match:
        die(f"source updater does not declare CODEX_SKILLS_VERSION: {path}")
    return match.group(1)


def cmd_self_update_check(project_root: Path) -> None:
    config = parse_config(project_root / "codex-skills.json")
    with tempfile.TemporaryDirectory(prefix="codex-skills-") as temp:
        source = Source(config["source"], config["ref"], Path(temp))
        source_script = source.resolve() / "scripts/codex-skills.sh"
        source_version = source_script_version(source_script)
        current_script = Path(os.environ["CODEX_SKILLS_SCRIPT_PATH"])
        current_digest = hashlib.sha256(current_script.read_bytes()).hexdigest()
        source_digest = hashlib.sha256(source_script.read_bytes()).hexdigest()
    print(f"current: {VERSION}")
    print(f"source: {source_version}")
    if source_version == VERSION and source_digest == current_digest:
        print("updater is current")
    else:
        print("updater differs from configured source; replace scripts/codex-skills.sh")


def parse_mode(args: list[str], command: str) -> str:
    if args == ["--dry-run"]:
        return "dry-run"
    if args == ["--apply"]:
        return "apply"
    die(f"{command} requires exactly one of --dry-run or --apply")


def usage() -> str:
    return f"""Usage: ./scripts/codex-skills.sh <command> [mode]

Commands:
  check                              Run the canonical repository-wide check
  sync --dry-run|--apply             Resolve, validate, stage, sync, prune, lock
  migrate-layout --dry-run|--apply   Preview or migrate legacy ./skills
  prune --dry-run|--apply            Preview or remove stale managed skills only
  validate                           Validate local/source skills and manifests
  list                               List selected or local canonical skills
  version                            Print updater version
  self-update-check                  Compare updater with configured source/ref

Compatibility aliases:
  update                             Same as sync --apply
  install                            Same as sync --apply
"""


def main() -> int:
    script_path = Path(os.environ["CODEX_SKILLS_SCRIPT_PATH"])
    if script_path.is_symlink():
        die(f"refusing symlinked updater script: {script_path}")
    project_root = script_path.absolute().parent.parent
    args = sys.argv[1:]
    if not args or args[0] in {"-h", "--help", "help"}:
        print(usage(), end="")
        return 0 if args else 2
    command, rest = args[0], args[1:]
    if command == "sync":
        cmd_sync(project_root, parse_mode(rest, command))
    elif command == "check":
        if rest:
            die("check does not accept arguments")
        cmd_check(project_root)
    elif command in {"update", "install"}:
        if rest:
            die(f"{command} does not accept arguments")
        cmd_sync(project_root, "apply")
    elif command == "migrate-layout":
        cmd_migrate_layout(project_root, parse_mode(rest, command))
    elif command == "prune":
        cmd_prune(project_root, parse_mode(rest, command))
    elif command == "validate":
        if rest:
            die("validate does not accept arguments")
        cmd_validate(project_root)
    elif command == "list":
        if rest:
            die("list does not accept arguments")
        cmd_list(project_root)
    elif command == "version":
        if rest:
            die("version does not accept arguments")
        print(VERSION)
    elif command == "self-update-check":
        if rest:
            die("self-update-check does not accept arguments")
        cmd_self_update_check(project_root)
    else:
        print(usage(), file=sys.stderr, end="")
        return 2
    return 0


def interrupted(signum: int, _frame: Any) -> None:
    raise KeyboardInterrupt(f"signal {signum}")


for handled_signal in (signal.SIGHUP, signal.SIGINT, signal.SIGTERM):
    signal.signal(handled_signal, interrupted)

try:
    raise SystemExit(main())
except CodexSkillsError as exc:
    print(f"codex-skills: {exc}", file=sys.stderr)
    raise SystemExit(1)
except KeyboardInterrupt:
    print("codex-skills: interrupted", file=sys.stderr)
    raise SystemExit(130)
PY
