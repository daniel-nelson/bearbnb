## CRITICAL: Read this first

Before doing any work in the `api` directory, you MUST first read and follow all rules specified in `api/CLAUDE.md`. Do not proceed with any changes to files in the `api` directory without consulting that file first.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/office-hours` - Brainstorm and discuss ideas
- `/plan-ceo-review` - Strategy review from CEO perspective
- `/plan-eng-review` - Architecture and engineering review
- `/plan-design-review` - Design review for plans
- `/design-consultation` - Design consultation
- `/review` - Code review
- `/ship` - Ship changes
- `/land-and-deploy` - Land and deploy changes
- `/canary` - Canary deployment
- `/benchmark` - Performance benchmarking
- `/browse` - Web browsing (use this for ALL web browsing)
- `/qa` - QA testing
- `/qa-only` - QA testing only
- `/design-review` - Visual design review
- `/setup-browser-cookies` - Set up browser cookies
- `/setup-deploy` - Set up deployment
- `/retro` - Retrospective
- `/investigate` - Debug and investigate issues
- `/document-release` - Document a release
- `/codex` - Second opinion / knowledge base
- `/cso` - Chief Security Officer review
- `/autoplan` - Auto-review and planning
- `/careful` - Production safety checks
- `/freeze` - Scope freeze for edits
- `/guard` - Production guard rails
- `/unfreeze` - Unfreeze scoped edits
- `/gstack-upgrade` - Upgrade gstack

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.