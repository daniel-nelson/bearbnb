## CRITICAL: psychic-skill required

This is a Dream ORM / Psychic web framework application. You MUST use the **psychic-skill** for all development work. The psychic-skill contains comprehensive rules, conventions, and patterns for Dream and Psychic that must be followed.

### If psychic-skill is installed

It auto-loads when it detects Dream/Psychic imports or `psy` commands — no manual invocation needed. To check for updates, run `/psychic-update-skill`.

### If psychic-skill is NOT installed

**Stop and install it before doing any work.** Run:

```
git clone https://github.com/daniel-nelson/psychic-skill.git .claude/skills/psychic-skill && cd .claude/skills/psychic-skill && ./setup
```

Then restart Claude Code so the skill loads.

**Do not attempt to work on this codebase without the psychic-skill installed.** It contains critical rules about generators, migrations, testing, naming conventions, STI patterns, and framework APIs that cannot be safely guessed or assumed.
