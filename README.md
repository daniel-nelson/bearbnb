# Welcome to your new Dream & Psychic app!

Check out [the docs](https://psychicframework.com/) or the [BearBnB demo app](https://github.com/rvohealth/bearbnb).

Perhaps [create some resources](https://psychicframework.com/docs/controllers/generating#resources)?

If you run into problems, ask questions on [Stack Overflow](https://stackoverflow.com/) using the `dream` or `psychic` tags.

### AI

This project ships with AI tooling for Dream and Psychic development.

**Psychic-skill** — If you chose to install the psychic-skill during setup, it provides comprehensive rules and conventions for Dream and Psychic development. Claude Code loads it automatically; see `.claude/skills/psychic-skill`. For Codex, see `.agents/skills/psychic-skill`.

**AI rules** — `./api/CLAUDE.md` and `./api/AGENTS.md`\* direct your agent to the **psychic-skill**, which is the single source of truth for Dream and Psychic conventions, patterns, and rules. Update the skill itself (via `/psychic-update-skill` or `git fetch origin && git reset --hard origin/main && ./setup` inside the skill directory) to get the latest guidance.

\* if this Psychic app was created without a front-end client, then these files are in the project root
