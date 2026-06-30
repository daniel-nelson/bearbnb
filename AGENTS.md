## CRITICAL: load psychic-skill before backend work

This is a Dream ORM / Psychic web framework application. Before reading or editing **any** file under `api/`, you MUST load **psychic-skill**. It is the single source of truth for Dream and Psychic conventions — generators, migrations, STI, serializers, controllers, naming, testing. There are no inline framework rules in this file.

How to load it depends on your agent:

- **Codex CLI** auto-discovers skills from its skills directories. Confirm a `psychic-skill` skill is listed; if not, install it per `api/AGENTS.md`. <!-- source: https://developers.openai.com/codex/skills accessed 2026-04-25 -->
- **Any other agent that does not natively support skills** (Aider, Cursor, Cline, Windsurf, Gemini CLI, etc.): treat the skill files as prescribed reading. See `api/AGENTS.md` for the file locations and the order to read them in.

Do not attempt backend work without the skill loaded — every previous attempt has produced code that violates framework conventions.

## Project layout

There is **no root `package.json`**. The repo is a monorepo containing:

- `api/` — the Dream/Psychic back end. Almost every script you run is defined in `api/package.json`, and `api/` is the directory you run it from.
- One or more front-end apps in sibling directories (e.g. `client/`, `admin/`, `internal/`), each with its own `package.json`. Names and count are project-specific.

## Installing dependencies

Run `pnpm install` inside **each directory that has a `package.json`** — `api/` and every front-end directory. There is no root install.

## Where to run commands

**From `api/` — almost everything:**

- `pnpm psy <command>` — Psychic CLI (migrations, generators, `sync`, `db:reset`, etc.). Always check `pnpm psy <command> --help` before using a generator.
- `pnpm uspec`, `pnpm fspec`, `pnpm fspec:visible` — unit specs, headless feature specs, and feature specs with a visible browser. Feature specs drive the front-end apps.
- `pnpm web:dev`, `pnpm worker:dev`, `pnpm ws:dev` — API web server, background worker, and websocket server.
- **Front-end dev servers also launch from `api/`.** Generated projects include wrapper scripts — typically `pnpm client`, `pnpm admin`, `pnpm internal` (and a `:fspec` variant of each used by feature specs) — that run `pnpm --dir=../<name> next dev`. **Do not `cd` into a front-end directory to start it.**
- `pnpm console` — Psychic REPL.
- `pnpm build`, `pnpm build:spec` — production and spec/type-check builds.
- `pnpm format`, `pnpm lint` — prettier write, and eslint + prettier check. Run `pnpm format` before committing.

**From a front-end directory — rare:**

Only the scripts defined in that directory's own `package.json` (e.g. `pnpm dev`, `pnpm build`, `pnpm lint`). Day-to-day work rarely needs these; the `api/` wrapper scripts above handle dev server startup.

## Front-end datetime handling

Do not hand-roll date, time, or datetime handling in front-end code — no raw `Date` arithmetic, no manual string parsing or formatting, no ad-hoc timezone math. Use a well-maintained datetime library. **Luxon** (`DateTime`, `Duration`, `Interval`) is the recommended default; if the project already uses a different modern library consistently, match it. This applies to every front-end app in the repo (commonly `client/`, `admin/`, `internal/`, but anything outside `api/`).

Backend datetime rules are different and live in the psychic-skill — do not apply this guidance to anything under `api/`.
