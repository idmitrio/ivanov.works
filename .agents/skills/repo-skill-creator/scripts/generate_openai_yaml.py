#!/usr/bin/env python3
"""
Generate agents/openai.yaml for a Codex skill.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import yaml

ACRONYMS = {
    "API",
    "CI",
    "CLI",
    "GH",
    "LLM",
    "MCP",
    "PDF",
    "PR",
    "SQL",
    "UI",
    "URL",
}

BRANDS = {
    "codex": "Codex",
    "github": "GitHub",
    "openai": "OpenAI",
    "pyrus": "Pyrus",
    "readme": "README",
    "yandex": "Yandex",
}

SMALL_WORDS = {"and", "or", "to", "up", "with"}

ALLOWED_INTERFACE_KEYS = {
    "brand_color",
    "default_prompt",
    "display_name",
    "icon_large",
    "icon_small",
    "short_description",
}


def yaml_quote(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    return f'"{escaped}"'


def format_display_name(skill_name: str) -> str:
    words = [word for word in skill_name.split("-") if word]
    formatted = []
    for index, word in enumerate(words):
        lower = word.lower()
        upper = word.upper()
        if upper in ACRONYMS:
            formatted.append(upper)
        elif lower in BRANDS:
            formatted.append(BRANDS[lower])
        elif index > 0 and lower in SMALL_WORDS:
            formatted.append(lower)
        else:
            formatted.append(word.capitalize())
    return " ".join(formatted)


def generate_short_description(display_name: str) -> str:
    value = f"Help with {display_name} tasks"
    if len(value) < 25:
        value = f"Help with {display_name} tasks and workflows"
    if len(value) > 80:
        value = f"{display_name} workflow helper"
    return value[:100].rstrip()


def generate_default_prompt(display_name: str) -> str:
    return f"Use this skill to complete a {display_name} task."


def read_frontmatter_name(skill_dir: Path) -> str | None:
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        print(f"[ERROR] SKILL.md not found in {skill_dir}", file=sys.stderr)
        return None

    content = skill_md.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---(?:\n|$)", content, re.DOTALL)
    if not match:
        print("[ERROR] Invalid SKILL.md frontmatter format.", file=sys.stderr)
        return None

    try:
        frontmatter = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        print(f"[ERROR] Invalid YAML frontmatter: {exc}", file=sys.stderr)
        return None

    if not isinstance(frontmatter, dict):
        print("[ERROR] Frontmatter must be a YAML dictionary.", file=sys.stderr)
        return None

    name = frontmatter.get("name")
    if not isinstance(name, str) or not name.strip():
        print("[ERROR] Frontmatter 'name' is missing or invalid.", file=sys.stderr)
        return None
    return name.strip()


def parse_interface_overrides(raw_overrides: list[str]) -> tuple[dict[str, str], list[str]] | None:
    overrides: dict[str, str] = {}
    optional_order: list[str] = []

    for item in raw_overrides:
        if "=" not in item:
            print(f"[ERROR] Invalid interface override '{item}'. Use key=value.", file=sys.stderr)
            return None
        key, value = item.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key not in ALLOWED_INTERFACE_KEYS:
            allowed = ", ".join(sorted(ALLOWED_INTERFACE_KEYS))
            print(f"[ERROR] Unknown interface field '{key}'. Allowed: {allowed}", file=sys.stderr)
            return None
        overrides[key] = value
        if key not in {"display_name", "short_description"} and key not in optional_order:
            optional_order.append(key)

    return overrides, optional_order


def write_openai_yaml(skill_dir: Path, skill_name: str, raw_overrides: list[str]) -> bool:
    parsed = parse_interface_overrides(raw_overrides)
    if parsed is None:
        return False
    overrides, optional_order = parsed

    display_name = overrides.get("display_name") or format_display_name(skill_name)
    short_description = overrides.get("short_description") or generate_short_description(display_name)
    default_prompt = overrides.get("default_prompt") or generate_default_prompt(display_name)

    lines = [
        "interface:",
        f"  display_name: {yaml_quote(display_name)}",
        f"  short_description: {yaml_quote(short_description)}",
        f"  default_prompt: {yaml_quote(default_prompt)}",
    ]

    for key in optional_order:
        if key == "default_prompt":
            continue
        lines.append(f"  {key}: {yaml_quote(overrides[key])}")

    agents_dir = skill_dir / "agents"
    agents_dir.mkdir(parents=True, exist_ok=True)
    output = agents_dir / "openai.yaml"
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[OK] Wrote {output}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate agents/openai.yaml for a skill.")
    parser.add_argument("skill_dir", help="Path to the skill directory.")
    parser.add_argument("--name", help="Skill name override. Defaults to SKILL.md frontmatter.")
    parser.add_argument(
        "--interface",
        action="append",
        default=[],
        help="Interface override in key=value format. May be repeated.",
    )
    args = parser.parse_args()

    skill_dir = Path(args.skill_dir).resolve()
    if not skill_dir.is_dir():
        print(f"[ERROR] Skill directory not found: {skill_dir}", file=sys.stderr)
        return 1

    skill_name = args.name or read_frontmatter_name(skill_dir)
    if not skill_name:
        return 1

    return 0 if write_openai_yaml(skill_dir, skill_name, args.interface) else 1


if __name__ == "__main__":
    sys.exit(main())
