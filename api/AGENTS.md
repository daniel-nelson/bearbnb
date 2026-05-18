## CRITICAL: load psychic-skill before any work in this directory

This is the Dream ORM / Psychic back end. Before reading or editing any file here, you MUST load **psychic-skill**. It contains the rules for generators, migrations, STI, serializers, controllers, naming, testing, workers, and websockets — none of which can be safely guessed.

How to load it depends on your agent.

### Codex CLI

Codex auto-discovers skills from its skill directories. Confirm a `psychic-skill` skill is registered. If it is not, install it:

Personal install:

```
git clone https://github.com/daniel-nelson/psychic-skill.git ~/.codex/skills/psychic-skill && cd ~/.codex/skills/psychic-skill && ./setup
```

Project install (checked into this repo):

```
git clone https://github.com/daniel-nelson/psychic-skill.git .codex/skills/psychic-skill && cd .codex/skills/psychic-skill && ./setup
```

The psychic-skill installer targets `.codex/skills/` and `~/.codex/skills/`. Note that OpenAI's published Codex docs describe `.agents/skills/` and `$HOME/.agents/skills/` as the canonical skill locations <!-- source: https://developers.openai.com/codex/skills accessed 2026-04-25 -->; if your Codex build only reads `.agents/skills/`, symlink the install: `ln -s ~/.codex/skills/psychic-skill ~/.agents/skills/psychic-skill`.

To update: run `/psychic-update-skill`, or `cd ~/.codex/skills/psychic-skill && git fetch origin && git reset --hard origin/main && ./setup`.

### Any other agent (Aider, Cursor, Cline, Windsurf, Gemini CLI, etc.)

Skills are not a universal concept. <!-- source: https://agents.md/ accessed 2026-04-25 — AGENTS.md is the cross-agent open standard; tools that read it generally do not implement Claude/Codex-style skill loaders --> If your agent does not have a documented skill loader, treat the psychic-skill files as **prescribed reading**: read them with your normal file tools before doing any backend work.

If the skill is not yet cloned anywhere your agent can read, install it:

```
git clone https://github.com/daniel-nelson/psychic-skill.git .ai/psychic-skill
```

Then, before writing or editing any code in `api/`, read `SKILL.md` from the cloned directory and follow every topic-file link it references (`models.md`, `controllers.md`, `serializers.md`, `sti.md`, `migrations.md`, `querying.md`, `testing.md`, `workers.md`, `websockets.md`, and any others). `SKILL.md` is the canonical index — its link list is kept current; do not rely on a list elsewhere.

The skill is also typically already installed at `.claude/skills/psychic-skill/`, `~/.claude/skills/psychic-skill/`, `.codex/skills/psychic-skill/`, or `~/.codex/skills/psychic-skill/` — check those locations before re-cloning.

To update: `cd <skill-dir> && git fetch origin && git reset --hard origin/main && ./setup`.

## Security — don't weaken the supply-chain hardening

This app ships install-time supply-chain hardening (dependency build-script
blocking, a release-age cooldown, registry pinning, a Node floor, and hardened
CI). **`SECURITY.md` is the source of truth** — read it before changing
`.npmrc`, `pnpm-workspace.yaml`, `.yarnrc.yml`, `package.json` engines, or
`.github/workflows/`. Do not relax these controls (re-enable dependency build
scripts, add third-party packages to the cooldown exclude, unpin CI action SHAs,
drop the frozen-lockfile install) without an explicit, reviewed reason.
