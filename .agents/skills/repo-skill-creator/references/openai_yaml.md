# OpenAI Interface Metadata

`agents/openai.yaml` is product-facing metadata for displaying and invoking a skill. Keep it short and deterministic.

## Required Shape

```yaml
interface:
  display_name: "Skill Creator"
  short_description: "Create and update Codex skills."
  default_prompt: "Use this skill to create or update a Codex skill."
```

## Interface Fields

- `display_name`: human-readable title for skill lists and chips.
- `short_description`: compact UI description. Prefer one sentence fragment.
- `default_prompt`: starting prompt that explains when to invoke the skill.
- `icon_small`: optional skill-relative icon path, usually `./assets/...`.
- `icon_large`: optional skill-relative logo path, usually `./assets/...`.
- `brand_color`: optional `#RRGGBB` accent color.

Quote all string values. Keep paths skill-relative and do not reference machine-local absolute paths.

## Helper

Generate or refresh the file with:

```bash
python3 .agents/skills/repo-skill-creator/scripts/generate_openai_yaml.py .agents/skills/<skill-name> \
  --interface display_name="Example Workflow" \
  --interface short_description="Create practical example workflows." \
  --interface default_prompt="Use this skill to create or update an example workflow."
```
