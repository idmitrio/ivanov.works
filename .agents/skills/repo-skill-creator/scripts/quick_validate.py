#!/usr/bin/env python3
"""
Validate Codex skill structure for codex-shared-skills.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import unquote

import yaml

MAX_SKILL_NAME_LENGTH = 64
MAX_DESCRIPTION_LENGTH = 1024
MAX_SKILL_BODY_LINES = 500
MAX_MAIN_SKILL_CHARACTERS = 12_000
MAX_MAIN_SKILL_ESTIMATED_TOKENS = 3_000
SKILL_ROOT_RELATIVE = Path(".agents/skills")
MARKER_NAME = ".codex-shared-skill.json"
ALLOWED_FRONTMATTER_KEYS = {"allowed-tools", "description", "license", "metadata", "name"}
RESERVED_SKILL_NAME_WORDS = {"anthropic", "claude"}
PROVIDER_BRAND_NAME_WORDS = {"chatgpt", "openai"}
VAGUE_DESCRIPTION_PATTERNS = (
    r"\bdoes stuff\b",
    r"\bhelps? with\b",
    r"\bhandles? things\b",
    r"\bmisc\b",
    r"\butils?\b",
)
FIRST_PERSON_DESCRIPTION_PATTERNS = (
    r"\bi can\b",
    r"\bwe can\b",
    r"\byou can use\b",
)
WINDOWS_PATH_PATTERN = re.compile(r"(?:^|[\s`\"'])[\w.-]+\\[\w.-]+\.[A-Za-z0-9]+")
REQUIRED_INTERFACE_FIELDS = {"default_prompt", "display_name", "short_description"}
ALLOWED_INTERFACE_KEYS = {
    "brand_color",
    "default_prompt",
    "display_name",
    "icon_large",
    "icon_small",
    "short_description",
}
ALLOWED_OPENAI_TOP_LEVEL_KEYS = {"dependencies", "interface", "policy"}
MANIFEST_SCHEMA_VERSION = 1


class Reporter:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, path: Path, message: str) -> None:
        self.errors.append(f"{path}: {message}")

    def warn(self, path: Path, message: str) -> None:
        self.warnings.append(f"{path}: warning: {message}")


def load_yaml(path: Path, text: str, reporter: Reporter) -> Any:
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as exc:
        reporter.error(path, f"invalid YAML: {exc}")
        return None


def validate_skill_name(path: Path, name: str, reporter: Reporter) -> None:
    if not name:
        reporter.error(path, "name must not be empty")
        return
    if not re.fullmatch(r"[a-z0-9-]+", name):
        reporter.error(path, f"name '{name}' must use lowercase letters, digits, and hyphens only")
    if name.startswith("-") or name.endswith("-") or "--" in name:
        reporter.error(path, f"name '{name}' cannot start/end with hyphen or contain consecutive hyphens")
    if len(name) > MAX_SKILL_NAME_LENGTH:
        reporter.error(path, f"name is too long ({len(name)} characters); max is {MAX_SKILL_NAME_LENGTH}")
    for reserved_word in sorted(RESERVED_SKILL_NAME_WORDS):
        if reserved_word in name:
            reporter.error(path, f"name '{name}' must not contain reserved word '{reserved_word}'")
    for brand_word in sorted(PROVIDER_BRAND_NAME_WORDS):
        if brand_word in name:
            reporter.warn(path, f"name '{name}' contains provider brand term '{brand_word}'; use only for provider-specific skills")


def validate_description_quality(path: Path, description: str, reporter: Reporter) -> None:
    lower_description = description.lower()

    for pattern in VAGUE_DESCRIPTION_PATTERNS:
        if re.search(pattern, lower_description):
            reporter.warn(path, "description looks vague; describe what the skill does and when to use it")
            break

    for pattern in FIRST_PERSON_DESCRIPTION_PATTERNS:
        if re.search(pattern, lower_description):
            reporter.warn(path, "description should be written in third person for reliable skill discovery")
            break

    if "use when" not in lower_description and "when " not in lower_description:
        reporter.warn(path, "description should include when to use the skill")


def validate_markdown_quality(path: Path, content: str, body: str, reporter: Reporter) -> None:
    body_line_count = len(body.splitlines())
    if body_line_count > MAX_SKILL_BODY_LINES:
        reporter.warn(path, f"SKILL.md body is long ({body_line_count} lines); prefer under {MAX_SKILL_BODY_LINES} lines")

    character_count = len(content)
    estimated_tokens = (character_count + 3) // 4
    if (
        character_count > MAX_MAIN_SKILL_CHARACTERS
        or estimated_tokens > MAX_MAIN_SKILL_ESTIMATED_TOKENS
    ):
        reporter.warn(
            path,
            f"main SKILL.md is large ({character_count} characters, "
            f"~{estimated_tokens} tokens); move detailed material to references",
        )

    for line_number, line in enumerate(content.splitlines(), start=1):
        if WINDOWS_PATH_PATTERN.search(line):
            reporter.warn(path, f"line {line_number} looks like a Windows-style path; use forward slashes")
            break


def validate_frontmatter(skill_dir: Path, reporter: Reporter) -> None:
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        reporter.error(skill_md, "missing required SKILL.md")
        return

    content = skill_md.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---(?:\n|$)", content, re.DOTALL)
    if not match:
        reporter.error(skill_md, "missing or invalid YAML frontmatter")
        return

    frontmatter = load_yaml(skill_md, match.group(1), reporter)
    if not isinstance(frontmatter, dict):
        reporter.error(skill_md, "frontmatter must be a YAML mapping")
        return

    unexpected = set(frontmatter) - ALLOWED_FRONTMATTER_KEYS
    if unexpected:
        allowed = ", ".join(sorted(ALLOWED_FRONTMATTER_KEYS))
        reporter.error(skill_md, f"unexpected frontmatter keys: {', '.join(sorted(unexpected))}; allowed: {allowed}")

    for key in ("name", "description"):
        if key not in frontmatter:
            reporter.error(skill_md, f"missing required frontmatter key '{key}'")

    name = frontmatter.get("name")
    if not isinstance(name, str):
        reporter.error(skill_md, f"name must be a string, got {type(name).__name__}")
    else:
        normalized_name = name.strip()
        validate_skill_name(skill_md, normalized_name, reporter)
        if normalized_name != skill_dir.name:
            reporter.error(skill_md, f"name '{normalized_name}' must match directory name '{skill_dir.name}'")

    description = frontmatter.get("description")
    if not isinstance(description, str):
        reporter.error(skill_md, f"description must be a string, got {type(description).__name__}")
    else:
        description = description.strip()
        if not description:
            reporter.error(skill_md, "description must not be empty")
        if "<" in description or ">" in description:
            reporter.error(skill_md, "description must not contain angle brackets")
        if len(description) > MAX_DESCRIPTION_LENGTH:
            reporter.error(skill_md, f"description is too long ({len(description)} characters); max is {MAX_DESCRIPTION_LENGTH}")
        validate_description_quality(skill_md, description, reporter)

    body = content[match.end() :].strip()
    if not body:
        reporter.error(skill_md, "body must not be empty")
    else:
        validate_markdown_quality(skill_md, content, body, reporter)


def validate_openai_yaml(skill_dir: Path, reporter: Reporter, require_openai: bool) -> None:
    openai_yaml = skill_dir / "agents" / "openai.yaml"
    if not openai_yaml.exists():
        if require_openai:
            reporter.error(openai_yaml, "missing required agents/openai.yaml")
        else:
            reporter.warn(openai_yaml, "missing agents/openai.yaml")
        return

    data = load_yaml(openai_yaml, openai_yaml.read_text(encoding="utf-8"), reporter)
    if not isinstance(data, dict):
        reporter.error(openai_yaml, "file must be a YAML mapping")
        return

    unexpected_top = set(data) - ALLOWED_OPENAI_TOP_LEVEL_KEYS
    if unexpected_top:
        allowed = ", ".join(sorted(ALLOWED_OPENAI_TOP_LEVEL_KEYS))
        reporter.error(openai_yaml, f"unexpected top-level keys: {', '.join(sorted(unexpected_top))}; allowed: {allowed}")

    interface = data.get("interface")
    if not isinstance(interface, dict):
        reporter.error(openai_yaml, "missing or invalid interface mapping")
        return

    unexpected_interface = set(interface) - ALLOWED_INTERFACE_KEYS
    if unexpected_interface:
        allowed = ", ".join(sorted(ALLOWED_INTERFACE_KEYS))
        reporter.error(openai_yaml, f"unexpected interface keys: {', '.join(sorted(unexpected_interface))}; allowed: {allowed}")

    for field in sorted(REQUIRED_INTERFACE_FIELDS):
        value = interface.get(field)
        if not isinstance(value, str) or not value.strip():
            reporter.error(openai_yaml, f"interface.{field} must be a non-empty string")

    short_description = interface.get("short_description")
    if isinstance(short_description, str) and len(short_description) > 120:
        reporter.warn(openai_yaml, "interface.short_description is long for UI display")

    brand_color = interface.get("brand_color")
    if brand_color is not None and (
        not isinstance(brand_color, str) or not re.fullmatch(r"#[0-9A-Fa-f]{6}", brand_color)
    ):
        reporter.error(openai_yaml, "interface.brand_color must be a #RRGGBB hex color")

    for icon_key in ("icon_large", "icon_small"):
        icon_path = interface.get(icon_key)
        if not isinstance(icon_path, str) or not icon_path.strip():
            continue
        if icon_path.startswith("/") or ".." in Path(icon_path).parts:
            reporter.error(openai_yaml, f"interface.{icon_key} must be a skill-relative path")
        else:
            normalized = icon_path[2:] if icon_path.startswith("./") else icon_path
            if not (skill_dir / normalized).exists():
                reporter.error(openai_yaml, f"interface.{icon_key} points to missing file: {icon_path}")


def load_manifest(skill_dir: Path, reporter: Reporter) -> list[str] | None:
    manifest = skill_dir / "skill-manifest.json"
    if not manifest.is_file() or manifest.is_symlink():
        reporter.error(manifest, "missing required regular skill-manifest.json")
        return None
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        reporter.error(manifest, f"invalid JSON: {exc}")
        return None
    if not isinstance(data, dict) or set(data) != {"schema_version", "requires"}:
        reporter.error(manifest, "must contain only schema_version and requires")
        return None
    if data["schema_version"] != MANIFEST_SCHEMA_VERSION:
        reporter.error(
            manifest,
            f"schema_version must be {MANIFEST_SCHEMA_VERSION}, got {data['schema_version']!r}",
        )
    requires = data["requires"]
    if not isinstance(requires, list):
        reporter.error(manifest, "requires must be an array")
        return None
    result: list[str] = []
    for dependency in requires:
        if not isinstance(dependency, str):
            reporter.error(manifest, "every requires entry must be a string")
            continue
        before = len(reporter.errors)
        validate_skill_name(manifest, dependency, reporter)
        if len(reporter.errors) == before:
            if dependency in result:
                reporter.error(manifest, f"duplicate dependency '{dependency}'")
            else:
                result.append(dependency)
    return result


def validate_manifest_graph(skills: list[Path], reporter: Reporter) -> None:
    graph: dict[str, list[str]] = {}
    for skill_dir in skills:
        requires = load_manifest(skill_dir, reporter)
        if requires is not None:
            graph[skill_dir.name] = requires
    for name, requires in graph.items():
        for dependency in requires:
            if dependency not in graph:
                reporter.error(
                    Path(name) / "skill-manifest.json",
                    f"missing shared-skill dependency '{dependency}'",
                )
    visited: set[str] = set()
    visiting: list[str] = []

    def visit(name: str) -> None:
        if name in visiting:
            start = visiting.index(name)
            reporter.error(
                Path(name) / "skill-manifest.json",
                "dependency cycle: " + " -> ".join([*visiting[start:], name]),
            )
            return
        if name in visited:
            return
        visiting.append(name)
        for dependency in graph.get(name, []):
            if dependency in graph:
                visit(dependency)
        visiting.pop()
        visited.add(name)

    for name in graph:
        visit(name)


def validate_skill(
    skill_dir: Path,
    reporter: Reporter,
    require_openai: bool,
    require_manifest: bool = False,
) -> None:
    if not skill_dir.is_dir():
        reporter.error(skill_dir, "skill path is not a directory")
        return
    validate_skill_name(skill_dir, skill_dir.name, reporter)
    validate_frontmatter(skill_dir, reporter)
    validate_openai_yaml(skill_dir, reporter, require_openai)
    managed_marker = skill_dir / MARKER_NAME
    if require_manifest or managed_marker.exists():
        load_manifest(skill_dir, reporter)


def discover_skills(skills_dir: Path) -> list[Path]:
    return sorted(path for path in skills_dir.iterdir() if path.is_dir())


def repository_files(root: Path, suffix: str | None = None) -> list[Path]:
    excluded = {".git", ".idea", ".mypy_cache", ".pytest_cache", ".ruff_cache", "__pycache__", "node_modules", "tmp", "temp", "vendor"}
    result: list[Path] = []
    for current, directories, files in os.walk(root, followlinks=False):
        directories[:] = [name for name in directories if name not in excluded]
        base = Path(current)
        for name in files:
            path = base / name
            if suffix is None or path.suffix == suffix:
                result.append(path)
    return sorted(result)


def validate_repository_layout(root: Path, reporter: Reporter) -> list[Path]:
    agents_dir = root / ".agents"
    skills_dir = root / SKILL_ROOT_RELATIVE
    if agents_dir.is_symlink():
        reporter.error(agents_dir, "canonical .agents directory must not be a symlink")
        return []
    if skills_dir.is_symlink() or not skills_dir.is_dir():
        reporter.error(skills_dir, "canonical root must be a regular directory")
        return []
    legacy_root = root / "skills"
    if legacy_root.exists() or legacy_root.is_symlink():
        reporter.error(legacy_root, "unexpected legacy canonical root; only .agents/skills is allowed")

    for current, directories, files in os.walk(skills_dir, followlinks=False):
        base = Path(current)
        for name in [*directories, *files]:
            candidate = base / name
            if candidate.is_symlink():
                reporter.error(candidate, "symlinks are forbidden in canonical skills")
        for name in files:
            candidate = base / name
            if name == MARKER_NAME:
                reporter.error(candidate, "canonical skills must not contain managed-copy markers")
            if name == "SKILL.md" and candidate.parent.parent != skills_dir:
                reporter.error(candidate, "skills must be direct children of .agents/skills")

    entries = sorted(skills_dir.iterdir())
    for entry in entries:
        if not entry.is_dir():
            reporter.error(entry, "canonical root may contain only direct child skill directories")
    skills = [entry for entry in entries if entry.is_dir() and not entry.is_symlink()]
    if not skills:
        reporter.error(skills_dir, "no canonical skills found")
    return skills


def validate_readme_registry(root: Path, skills: list[Path], reporter: Reporter) -> None:
    readme = root / "README.md"
    try:
        content = readme.read_text(encoding="utf-8")
    except OSError as exc:
        reporter.error(readme, f"cannot read README registry: {exc}")
        return
    section = re.search(r"^## Available Shared Skills\s*$\n(.*?)(?=^##\s|\Z)", content, re.MULTILINE | re.DOTALL)
    if not section:
        reporter.error(readme, "missing 'Shared Skills' registry section")
        return
    registry: dict[str, str] = {}
    for match in re.finditer(
        r"^- \[([a-z0-9][a-z0-9-]*)\]\((\.agents/skills/[^)]+/SKILL\.md)\)\s+-\s+.+$",
        section.group(1),
        re.MULTILINE,
    ):
        name, target = match.groups()
        if name in registry:
            reporter.error(readme, f"duplicate README registry entry '{name}'")
        registry[name] = target
    canonical = {skill.name for skill in skills}
    registered = set(registry)
    for name in sorted(canonical - registered):
        reporter.error(readme, f"README registry is missing canonical skill '{name}'")
    for name in sorted(registered - canonical):
        reporter.error(readme, f"README registry contains unknown skill '{name}'")
    for name, target in registry.items():
        expected = f".agents/skills/{name}/SKILL.md"
        if target != expected:
            reporter.error(readme, f"registry entry '{name}' must link to {expected}")


def validate_internal_markdown_links(root: Path, reporter: Reporter) -> None:
    link_pattern = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
    for markdown in repository_files(root, ".md"):
        try:
            content = markdown.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            reporter.error(markdown, f"cannot read Markdown: {exc}")
            continue
        for line_number, line in enumerate(content.splitlines(), start=1):
            for match in link_pattern.finditer(line):
                raw_target = match.group(1).strip()
                if raw_target.startswith("<") and raw_target.endswith(">"):
                    raw_target = raw_target[1:-1]
                target = unquote(raw_target.split("#", 1)[0])
                if not target or re.match(r"^[a-z][a-z0-9+.-]*:", target, re.IGNORECASE):
                    continue
                if "<" in target or ">" in target:
                    continue
                candidate = (markdown.parent / target).resolve(strict=False)
                if not candidate.exists():
                    reporter.error(markdown, f"line {line_number} has broken internal link: {raw_target}")


def dependency_closure(selected: list[str], graph: dict[str, list[str]]) -> set[str]:
    resolved: set[str] = set()

    def visit(name: str) -> None:
        if name in resolved:
            return
        resolved.add(name)
        for dependency in graph.get(name, []):
            visit(dependency)

    for name in selected:
        visit(name)
    return resolved


def validate_local_overrides(root: Path, skills: list[Path], reporter: Reporter) -> None:
    graph: dict[str, list[str]] = {}
    for skill in skills:
        try:
            data = json.loads((skill / "skill-manifest.json").read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(data, dict) and isinstance(data.get("requires"), list):
            graph[skill.name] = [value for value in data["requires"] if isinstance(value, str)]

    for config_path in repository_files(root):
        if config_path.name != "codex-skills.json":
            continue
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            reporter.error(config_path, f"invalid codex-skills.json: {exc}")
            continue
        selected = config.get("skills") if isinstance(config, dict) else None
        overrides = config.get("local_overrides", {}) if isinstance(config, dict) else None
        if not isinstance(selected, list) or not all(isinstance(name, str) for name in selected):
            reporter.error(config_path, "skills must be an array of names")
            continue
        if len(selected) != len(set(selected)):
            reporter.error(config_path, "skills contains duplicate selected names")
        for name in selected:
            if name not in graph:
                reporter.error(config_path, f"selected skill '{name}' is not canonical")
        if not isinstance(overrides, dict):
            reporter.error(config_path, "local_overrides must be an object")
            continue
        resolved = dependency_closure(selected, graph)
        for name, relative in overrides.items():
            if name not in resolved:
                reporter.error(config_path, f"local_overrides key '{name}' is not selected or resolved")
            if not isinstance(relative, str) or not re.fullmatch(
                r"\.agents/skills/[a-z0-9][a-z0-9-]*/SKILL\.md", relative
            ):
                reporter.error(config_path, f"local_overrides.{name} has invalid flat skill path")
                continue
            if config_path.parent == root and not (root / relative).is_file():
                reporter.error(config_path, f"local_overrides.{name} points to missing file: {relative}")


def validate_script_syntax_and_modes(root: Path, skills: list[Path], reporter: Reporter) -> None:
    for path in repository_files(root, ".py"):
        try:
            source = path.read_text(encoding="utf-8")
            compile(source, str(path), "exec")
        except (OSError, UnicodeDecodeError, SyntaxError) as exc:
            reporter.error(path, f"Python syntax check failed: {exc}")
    for path in repository_files(root):
        try:
            first_line = path.open("r", encoding="utf-8").readline()
        except (OSError, UnicodeDecodeError):
            continue
        if path.suffix == ".sh" or first_line.startswith("#!/usr/bin/env bash") or first_line.startswith("#!/bin/sh"):
            result = subprocess.run(["bash", "-n", str(path)], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if result.returncode:
                reporter.error(path, f"shell syntax check failed: {result.stderr.strip()}")
    for skill in skills:
        scripts_dir = skill / "scripts"
        if not scripts_dir.is_dir():
            continue
        for helper in sorted(path for path in scripts_dir.rglob("*") if path.is_file()):
            try:
                first_line = helper.open("rb").readline()
            except OSError as exc:
                reporter.error(helper, f"cannot inspect helper script: {exc}")
                continue
            if first_line.startswith(b"#!") and not os.access(helper, os.X_OK):
                reporter.error(helper, "helper script has a shebang but is not executable")


def validate_generator_roundtrip(root: Path, reporter: Reporter) -> None:
    generator = root / SKILL_ROOT_RELATIVE / "repo-skill-creator" / "scripts" / "generate_openai_yaml.py"
    with tempfile.TemporaryDirectory(prefix="codex-skill-roundtrip-") as temp:
        skill = Path(temp) / "roundtrip-skill"
        skill.mkdir()
        (skill / "SKILL.md").write_text(
            "---\nname: roundtrip-skill\ndescription: Generate metadata when testing the canonical validator.\n---\n\n# Roundtrip\n",
            encoding="utf-8",
        )
        (skill / "skill-manifest.json").write_text(
            '{"schema_version":1,"requires":[]}\n', encoding="utf-8"
        )
        result = subprocess.run(
            [sys.executable, str(generator), str(skill)],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )
        if result.returncode:
            reporter.error(generator, f"generator roundtrip failed: {(result.stdout + result.stderr).strip()}")
            return
        before = len(reporter.errors)
        validate_skill(skill, reporter, require_openai=True)
        if len(reporter.errors) > before:
            reporter.error(generator, "generated metadata did not pass the canonical validator")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate one skill or all skills in a repository.")
    parser.add_argument("path", nargs="?", default=".", help="Skill directory or repository root. Defaults to current directory.")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Validate every direct child under <path>/.agents/skills.",
    )
    parser.add_argument(
        "--warn-missing-openai",
        action="store_true",
        help="Warn instead of fail when agents/openai.yaml is missing.",
    )
    args = parser.parse_args()

    target = Path(args.path).resolve()
    reporter = Reporter()
    require_openai = not args.warn_missing_openai

    if args.all:
        skills = validate_repository_layout(target, reporter)
        for skill_dir in skills:
            validate_skill(skill_dir, reporter, require_openai, require_manifest=True)
        validate_manifest_graph(skills, reporter)
        validate_readme_registry(target, skills, reporter)
        validate_internal_markdown_links(target, reporter)
        validate_local_overrides(target, skills, reporter)
        validate_script_syntax_and_modes(target, skills, reporter)
        validate_generator_roundtrip(target, reporter)
    else:
        skill_dir = target
        if (target / SKILL_ROOT_RELATIVE).is_dir() and not (target / "SKILL.md").exists():
            reporter.error(target, "looks like a repository root; use --all to validate ./.agents/skills")
        else:
            validate_skill(skill_dir, reporter, require_openai)

    for warning in reporter.warnings:
        print(warning, file=sys.stderr)
    for error in reporter.errors:
        print(error, file=sys.stderr)

    if reporter.errors:
        print(f"validation failed: {len(reporter.errors)} error(s), {len(reporter.warnings)} warning(s)")
        return 1

    print(f"validation passed: {len(reporter.warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
