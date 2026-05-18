## CRITICAL: invoke psychic-skill before any work in this directory

This is the Dream ORM / Psychic back end. Before reading or editing any file here, you MUST invoke **psychic-skill**. It contains the rules for generators, migrations, STI, serializers, controllers, naming, testing, workers, and websockets — none of which can be safely guessed.

Why this is non-negotiable: Claude Code only loads skill *descriptions* into context at session start; the skill body does not enter context until the skill is invoked. <!-- source: https://code.claude.com/docs/en/skills accessed 2026-04-25 — "In a regular session, skill descriptions are loaded into context so Claude knows what's available, but full skill content only loads when invoked." --> So even if you "see" `psychic-skill` listed, you do not have its rules until you invoke it. The skill has `user-invocable: false`, so you cannot type `/psychic-skill`. Invoke it via the `Skill` tool, or rely on auto-invocation (the skill triggers on Dream/Psychic imports and `psy` commands per its description) — but if auto-invocation hasn't fired by the time you're about to write code, invoke it explicitly.

If `psychic-skill` does not appear in your skills listing at all, the skill is not installed in this session. Install it before doing any work (see below), then start a new session — newly created top-level skills directories require restarting Claude Code to be picked up. <!-- source: https://code.claude.com/docs/en/skills accessed 2026-04-25 — "Creating a top-level skills directory that did not exist when the session started requires restarting Claude Code so the new directory can be watched." -->

## Installing the psychic-skill

Personal install (skill is available in every project on this machine):

```
git clone https://github.com/daniel-nelson/psychic-skill.git ~/.claude/skills/psychic-skill && cd ~/.claude/skills/psychic-skill && ./setup
```

Project install (skill is checked into this repo so teammates get it too):

```
git clone https://github.com/daniel-nelson/psychic-skill.git .claude/skills/psychic-skill && cd .claude/skills/psychic-skill && ./setup
```

Both `~/.claude/skills/<name>/SKILL.md` and `.claude/skills/<name>/SKILL.md` are documented Claude Code skill locations. Personal beats project when both define a skill with the same name. <!-- source: https://code.claude.com/docs/en/skills accessed 2026-04-25 — "Personal `~/.claude/skills/<skill-name>/SKILL.md`" and "Project `.claude/skills/<skill-name>/SKILL.md`" with precedence "enterprise > personal > project" -->

## Updating

Run `/psychic-update-skill` (a slash command bundled with the skill). Or, manually inside the skill directory:

```
git fetch origin && git reset --hard origin/main && ./setup
```

## Security — don't weaken the supply-chain hardening

This app ships install-time supply-chain hardening (dependency build-script
blocking, a release-age cooldown, registry pinning, a Node floor, and hardened
CI). **`SECURITY.md` is the source of truth** — read it before changing
`.npmrc`, `pnpm-workspace.yaml`, `.yarnrc.yml`, `package.json` engines, or
`.github/workflows/`. Do not relax these controls (re-enable dependency build
scripts, add third-party packages to the cooldown exclude, unpin CI action SHAs,
drop the frozen-lockfile install) without an explicit, reviewed reason.
