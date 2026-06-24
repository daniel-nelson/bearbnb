// Prod-build guard: proves test-only affordances cannot ship.
//
// The test hooks (client/src/lib/testHooks.ts) are loaded only behind the
// build-time `VITE_PSYCHIC_ENV === "test"` literal, so Vite dead-code-eliminates
// them from dev/prod bundles. This script makes that an enforced invariant: it
// scans the built dist/ output for the shared `__test` marker prefix and exits
// non-zero if any is ever present. Wired into `pnpm build`, so every production
// build (including CI) self-verifies.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MARKER = "__test";
const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const distDir = join(scriptDir, "..", "dist");

function jsFilesUnder(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...jsFilesUnder(full));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      out.push(full);
    }
  }
  return out;
}

const files = jsFilesUnder(distDir);

if (files.length === 0) {
  console.error(
    `assert-no-test-hooks: FAIL — no built JS found under ${distDir}; ` +
      "run the build before this guard.",
  );
  process.exit(1);
}

const offenders = files.filter((file) =>
  readFileSync(file, "utf8").includes(MARKER),
);

if (offenders.length > 0) {
  console.error(
    `assert-no-test-hooks: FAIL — test-only marker "${MARKER}" found in ` +
      `${offenders.length} production bundle file(s):\n` +
      offenders.map((file) => `  ${file}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  `assert-no-test-hooks: OK — "${MARKER}" absent from ${files.length} ` +
    "built JS file(s).",
);
