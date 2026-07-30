# Project Instructions

## Product Purpose

- This is the public website of “ИИ-студия Дмитрия Иванова”, a personal engineering AI studio for mid-sized B2B companies.
- The site must help a non-technical executive identify one repetitive operational process worth discussing.
- The primary conversion is opening and submitting the shared “Обсудить процесс” form. Keep this CTA visible and confident, never aggressive.
- Present the studio as founder-led and technically accountable, not as a large team, mass-market agency, or information-product business.
- Do not invent clients, testimonials, case studies, metrics, guarantees, addresses, phone numbers, legal details, or social accounts.

## Architecture and Ownership

- Product routes are `/`, `/privacy`, and `/case-template`; application code lives in `app/`.
- Global design tokens and responsive rules live in `app/globals.css`; reusable visual decisions should be expressed there instead of duplicated inline.
- Use the original SVG assets in `public/brand/` without changing their geometry. Do not redraw or “improve” the mark.
- The production runtime is Next.js in standalone Node.js mode. `Dockerfile` builds the application, `compose.yaml` runs it, and Caddy in `Caddyfile` terminates HTTPS and proxies requests to the app.
- Do not restore the obsolete vinext, Cloudflare Worker, Sites hosting, D1, or R2 runtime paths unless the user explicitly requests another hosting migration.
- Keep the application container private behind Caddy. Only Caddy exposes ports 80 and 443.
- Never edit managed copies in `.agents/skills/`; update them through `codex-skills.json` and `./scripts/codex-skills.sh`.
- Do not edit or commit generated/runtime output such as `.next/`, `node_modules/`, Caddy data, or ignored build artifacts.

## Design Direction

- The brand is a calm personal engineering studio, not a hype-driven AI agency.
- The visual character must remain strict, modern, technical, minimal, confident, spacious, and understandable to a non-technical executive.
- Use large typography, generous negative space, a clear vertical rhythm, compact navigation, thin rules, technical labels, and a small number of strong accents.
- Prefer process diagrams, document/data flows, rule checks, source labels, confidence indicators, and branches such as “processed automatically / sent to an employee”.
- Never introduce robots, brains, sparkles, space imagery, glowing neural networks, chatbot clichés, laptop stock photos, pseudo-technical 3D spheres, purple gradients, excessive glassmorphism, or decorative animation.
- Avoid grids of many identical rounded cards. Solution scenarios should read as large numbered rows, expandable structures, or asymmetric process compositions.
- Do not drift into generic SaaS styling, playful startup visuals, or random English AI terminology in public copy.

## Brand System

- Core colors: signal yellow `#FFFF00`, official logo black `#000000`, interface black `#111111`, deep navy `#0D172A`, warm background `#F3EFE5`, and white `#FFFFFF`.
- Use yellow sparingly for primary actions, stage numbers, key markers, and states. Text on yellow is always black; yellow is not body text on white.
- Use `#000000` for official logo geometry and `#111111` for interface/text roles; do not mix them arbitrarily.
- Do not place the official logo inside a rounded badge.
- Use Tektur for display headings, numbers, short labels, and technical accents. Use Onest for navigation, forms, body copy, and long descriptions.
- Body text is at least 18 px on desktop and 16 px on mobile, with a readable line length of roughly 60–75 characters.
- Keep long paragraphs out of Tektur.

## Layout and Components

- Validate the main layouts at 1440 px desktop and 390 px mobile.
- Desktop uses a 12-column system with a maximum content width of 1280 px and generous section spacing.
- Use restrained radii: 0–12 px for containers and square 0 px corners for buttons. Prefer thin borders and minimal shadows.
- Interactive targets are at least 44×44 px and have visible hover, active, disabled, and keyboard-focus states.
- The header is sticky over the hero, becomes more compact on scroll, and indicates the active section.
- Mobile navigation is a full-screen panel containing the brand, close control, section links, main CTA, Telegram, MAX, and email. Selecting a section closes the panel and scrolls smoothly.
- The FAQ remains an accessible keyboard-operable accordion.
- Motion should normally last 160–240 ms. Respect `prefers-reduced-motion`; never add heavy parallax or animation for decoration alone.

## Page and Content Rules

- The hero remains deep navy with white copy, signal-yellow CTA/mark, and substantial open space.
- Preserve the exact hero headline: “Сокращаем ручную работу в операционных процессах”.
- Preserve the main CTA label “Обсудить процесс” and the direct contacts: Telegram, MAX, and `dmitry@ivanov.works`.
- The solutions section must clearly distinguish input, system action, employee responsibility, and practical result. Do not number solution types.
- The process section must keep four stages without separate “control point” blocks.
- The founder section must remain personal and evidence-based. Keep it as the main text column without a separate logo/name card.
- `/case-template` is a future-case structure only. Do not surface a case on the main site until its company, result, and metrics are real and confirmed.
- `/privacy` remains an adaptive template with the explicit placeholder for approved policy text. Never invent legal text or operator details.
- Keep the metadata title and description aligned with managed AI solutions for documents, requests, support, and internal knowledge bases.

## Form and Accessibility Contract

- Every primary CTA opens the same “Обсудить процесс” modal.
- Desktop modal width stays within 640–720 px; mobile uses a scrollable `100dvh` full-screen layout with a fixed top bar and safe-area support.
- Preserve empty, focus, filled, validation-error, sending, success, network-error, and dirty-close confirmation states.
- Required validation messages are “Укажите имя”, “Укажите корректный контакт”, and “Нужно согласие на обработку персональных данных”.
- Errors use text and an icon, not color alone. During submission, prevent duplicate submits, show “Отправляем…”, and keep values until success is confirmed.
- Escape closes an empty form; a dirty form opens close confirmation. Lock background scrolling, trap focus, and return focus to the opening CTA.
- Meet WCAG AA: visible labels, logical tab order, sufficient contrast, linked error descriptions, keyboard access, and non-icon-only meaning.
- The cookie notice stays disabled unless optional analytics or advertising cookies are actually introduced.
- The form submits through `/api/contact` to the Telegram Bot API over the configured HTTP or HTTPS proxy.
- Required runtime variables are `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_PROXY_URL`, `TELEGRAM_PROXY_USER`, and `TELEGRAM_PROXY_PASSWORD`; `TELEGRAM_THREAD_ID` is optional.
- `TELEGRAM_PROXY_URL` must include its protocol, for example `http://proxy.example:3128`.
- Never expose secret variables to client code, include their values in logs, or commit `.env`.

## Commands and Verification

- Install dependencies with `npm ci`; run locally with `npm run dev`.
- `npm run build` is required for every product change and verifies the standalone Next.js build.
- Run `npm run lint` for TypeScript, React, or CSS work and report errors and warnings separately.
- Validate the deployment definition with `docker compose config --quiet`.
- Build and start production with `docker compose up -d --build`; inspect health and logs with `docker compose ps` and `docker compose logs`.
- Caddy issues and renews public TLS certificates automatically when DNS points to the server and inbound ports 80 and 443 are open.
- There is no automated test script yet. Do not claim tests pass based on lint or build alone.
- After visual changes, perform browser QA at 1440 px and 390 px. Check the hero, spacing, typography, menu, FAQ, form states, `/privacy`, and `/case-template`.
- Compare against supplied PNG references when available, but treat the approved written brief as authoritative for exact copy and behavior.
- Do not refresh committed screenshots unless the task explicitly includes visual comparison or reference updates.

## Git, Workflow, and Safety

- The integration branch is `develop`; create feature/fix branches through `git-branch-workflow`.
- Use `commit-workflow` only after an explicit commit request and stage only task-related files.
- Use `review-workflow` before `develop-pr-workflow`; use `release-workflow` for guarded releases.
- Route Yandex Tracker development tasks through `yandex-tracker-task-workflow` and direct Tracker operations through `yandex-tracker-api`.
- Never discard unrelated user changes in a dirty worktree.
- Never commit `.env*`, credentials, tokens, personal data, real form submissions, dumps, or logs.
- Publishing, analytics, external integrations, persistence, and access-policy changes require an explicit task and appropriate validation.
