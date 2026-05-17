# AGENTS.md

## Project Context

This repository contains the temporary public placeholder for `ivanov.works`.

The site is a static GitHub Pages site served from the repository root. Keep it intentionally small until the full website scope is defined.

## Working Rules

- Use plain static assets by default: `index.html`, `styles.css`, and small files in `assets/`.
- Keep Russian as the default language for public-facing copy unless a specific section needs English.
- Do not introduce a build step unless it is clearly needed for the next real site version.
- Keep the root deployable by GitHub Pages at all times.
- Preserve `CNAME` while the custom domain is intended to point to GitHub Pages.
- Prefer accessible, responsive markup over visual complexity.
- Avoid committing local editor files, generated junk, or secrets.

## Verification

For simple edits, open `index.html` locally or serve the folder with:

```bash
python3 -m http.server 8080
```

Then check `http://localhost:8080`.
