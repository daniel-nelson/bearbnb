#!/usr/bin/env node
// Mirror the committed .agents/skills/psychic-skill tree into .claude/skills via links,
// so there is a single source of truth (.agents) with no drifting committed duplicate.
//
// Runs under node OR bun (only node:* APIs used). Idempotent: safe to run on every install.
// POSIX -> relative symlink; Windows -> directory junction (no admin needed); last resort
// -> recursive copy so the skill is ALWAYS present after a successful run.
import {
  existsSync,
  lstatSync,
  readlinkSync,
  readdirSync,
  rmSync,
  mkdirSync,
  symlinkSync,
  cpSync,
} from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const isWindows = process.platform === 'win32'
const SKILL = 'psychic-skill'

// Find the app root: nearest ancestor containing .agents/skills/psychic-skill/SKILL.md.
function findAppRoot(start) {
  let dir = start
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, '.agents', 'skills', SKILL, 'SKILL.md'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = findAppRoot(scriptDir) || findAppRoot(process.cwd())
if (!appRoot) process.exit(0) // nothing to mirror (skill not installed as .agents tree)

const realSkills = join(appRoot, '.agents', 'skills')
const realTree = join(realSkills, SKILL)
const claudeSkills = join(appRoot, '.claude', 'skills')
mkdirSync(claudeSkills, { recursive: true })

// Build the link set: the skill itself, plus every sub-skill (dir with SKILL.md),
// matching ./setup's behavior. Sub-skill links point THROUGH the psychic-skill link.
const linkset = [{ name: SKILL, rel: join('..', '..', '.agents', 'skills', SKILL), abs: realTree }]
for (const entry of readdirSync(realTree)) {
  if (entry.startsWith('.') || entry === 'node_modules') continue
  if (existsSync(join(realTree, entry, 'SKILL.md'))) {
    linkset.push({ name: entry, rel: join(SKILL, entry), abs: join(realTree, entry) })
  }
}

let failures = 0
for (const { name, rel, abs } of linkset) {
  const linkPath = join(claudeSkills, name)
  try {
    ensureLink(linkPath, rel, abs)
  } catch (err) {
    failures++
    console.error(`[psychic-skill] could not link ${name}: ${err && err.message}`)
  }
}

if (failures > 0) {
  // Loud, but do NOT fail the install (exit 0) — a nonzero exit would abort `install`
  // for every PM. The copy fallback below normally guarantees presence anyway.
  console.error(
    `[psychic-skill] WARNING: ${failures} skill link(s) could not be created. ` +
      `Run "<your package manager> run link:skill" to retry.`,
  )
}
process.exit(0)

function lexists(p) {
  try {
    lstatSync(p)
    return true
  } catch {
    return false
  }
}

function ensureLink(linkPath, relTarget, absTarget) {
  if (lexists(linkPath)) {
    let good = false
    try {
      const st = lstatSync(linkPath)
      if (st.isSymbolicLink()) {
        good = resolve(dirname(linkPath), readlinkSync(linkPath)) === resolve(absTarget)
      }
    } catch {
      /* fall through to repair */
    }
    if (good) return
    rmSync(linkPath, { recursive: true, force: true }) // broken symlink / win text-file / stale copy
  }
  try {
    if (isWindows) symlinkSync(resolve(absTarget), linkPath, 'junction') // no privilege needed
    else symlinkSync(relTarget, linkPath) // portable relative symlink
    return
  } catch {
    cpSync(resolve(absTarget), linkPath, { recursive: true }) // floor: guarantee presence
  }
}
