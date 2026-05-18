# Security

This app ships with supply-chain hardening configured by `create-psychic`. The
controls below defend primarily against **install-time** attacks — the class of
npm worm (e.g. Shai-Hulud) that runs malicious code from a dependency's
`postinstall` script the moment you install it, or that publishes a compromised
version and relies on you installing it before anyone notices.

**Before weakening anything here, read "What you should NOT weaken" at the bottom.**

## What's configured, and what it defends against

### 1. Dependency build scripts are blocked by default

A dependency's lifecycle scripts (`postinstall`, `prepare`, …) are the single
most common install-time attack vector: installing the package runs the code.
Your package manager is configured to block them:

- **pnpm** — blocks **all** dependency build scripts by default. This app's
  dependency tree needs none, so there is no `allowBuilds` allowlist in
  `pnpm-workspace.yaml`. (esbuild ships prebuilt binaries; puppeteer's browser is
  installed by an explicit step, not a postinstall.)
- **Yarn** — `enableScripts: false` in `.yarnrc.yml` blocks all build scripts.
- **npm** — `ignore-scripts=true` in `.npmrc`. npm's flag is all-or-nothing (no
  per-package carve-out), but this app ships no lifecycle scripts of its own.

If you add a dependency that genuinely needs to build (a native addon, etc.),
re-enable **only that package** — pnpm: add it to an `allowBuilds:` map; Yarn:
`dependenciesMeta.<pkg>.built: true` in `package.json`; npm: there is no
per-package option, so you'd run that one build manually. Every entry re-opens
script execution, so keep the list minimal and review what you're allowing.

### 2. Release-age cooldown (3 days)

New dependency versions younger than **3 days** are not installed. Most
worm-injected releases are caught and unpublished inside that window, so the
cooldown rides it out. Three days sits under the typical critical-CVE patch SLA,
so routine security patching never has to bypass it.

- **pnpm** — `minimumReleaseAge: 4320` (minutes) in `pnpm-workspace.yaml`.
- **Yarn** — `npmMinimalAgeGate: 4320` in `.yarnrc.yml`.
- **npm** — `min-release-age=3` (days) in `.npmrc` (requires npm ≥ 11.10).

`@rvoh/*` packages (Dream/Psychic) are exempt from the cooldown — they come from
the trusted first-party publisher and ship frequently. pnpm/Yarn express this
exemption (`minimumReleaseAgeExclude` / `npmPreapprovedPackages`); npm has no
per-package exemption, so on npm the cooldown applies to `@rvoh/*` too.

### 3. Registry pinning

`registry=https://registry.npmjs.org` (npm/pnpm) / `npmRegistryServer` (Yarn)
pins installs to the public npm registry so they can't be silently redirected to
a malicious mirror by a stray environment variable or a tampered config.

### 4. Node version

`engines.node` requires Node **≥ 26** (Psychic's supported baseline — 26 is the
current LTS and 25 is already EOL). This is **advisory**: there is no
`engine-strict`, so the app still installs on older Node with a warning. `.nvmrc`
steers `nvm`/`fnm` users onto 26.

### 5. Hardened CI (if you generated it)

If you opted into the generated `.github/workflows/ci.yml`:

- The workflow's `GITHUB_TOKEN` is least-privilege (`permissions: contents: read`).
- Every action is pinned to an immutable commit SHA, not a mutable `@vN` tag (a
  tag can be force-moved to malicious code; a SHA can't).
- Dependencies install with a **frozen lockfile** — CI never silently resolves a
  newly-published (possibly compromised) version that isn't already in your
  lockfile.

## Operator runbook

**Applying a security patch that's still inside the cooldown window.** The 3-day
cooldown is deliberately shorter than the critical-CVE SLA, so a patched version
almost always clears it in time. If you genuinely must install a version younger
than 3 days, do it as a **transient, reverted** change — temporarily lower the
cooldown (or, on pnpm/Yarn, add a one-off exclude for that exact package), run
your install command (`pnpm install` / `yarn install` / `npm install`), then
restore the config in the same change. Never leave a permanent third-party
bypass behind.

**Keeping the cooldown exclude list clean.** Only `@rvoh/*` belongs in the
cooldown exemption (`minimumReleaseAgeExclude` / `npmPreapprovedPackages`). A
third-party entry is a permanent supply-chain hole — handle urgent third-party
patches with the transient approach above, not a standing exclude.

**Growing the CI spec suite.** The generated CI runs specs as a single shard
(`shard: ["1/1"]`) because a new app has too few spec files to split. As your
suite grows, parallelize across runners by editing the `shard:` matrix in
`.github/workflows/ci.yml` (e.g. `["1/2", "2/2"]`).

**Updating pinned CI actions.** Bump the action's commit SHA **and** the trailing
`# vX.Y.Z` comment together. Dependabot/Renovate understand this format and will
open the update PRs for you — review them, don't just merge.

## What you should NOT weaken

- **Don't add packages to the build-script allowlist without cause.** Each entry
  lets that dependency run arbitrary code at install time.
- **Don't add third-party packages to the cooldown exclude list.** Keep it
  `@rvoh/*`-only.
- **Don't unpin the CI actions** back to `@vN` tags, and **don't drop
  `--frozen-lockfile` / `--immutable` / `npm ci`** in CI.
- **Don't commit production secrets.** The encryption keys and DB credentials in
  the generated CI are throwaway, test-only values for an ephemeral database. Real
  secrets belong in GitHub Actions encrypted secrets (`${{ secrets.NAME }}`).

## Production container hardening (example to adapt — NOT a turnkey config)

create-psychic generates a **dev** `Dockerfile.dev` only. It deliberately does
**not** generate a production Dockerfile: a blessed prod image would rot (its
pinned base goes stale and unpatched), carry a large blast radius across every
generated app, and an implied "the generator vetted this" tends to reduce the
scrutiny a production image actually deserves. The following is a **reference to
read, understand, and adapt** — not a drop-in.

Two things matter most, and neither is provided by Node's runtime `--permission`
model (which can't restrict network egress, and whose value is undercut by the
native-addon escape hatch most real apps need):

1. **Run as a non-root user on a minimal, pinned, regularly-updated base.**
2. **Restrict network egress at the orchestrator** — this is the control that
   actually contains a compromised dependency trying to exfiltrate data or phone
   home, and it lives in your platform (k8s/your cloud), not in Node.

Example production Dockerfile to adapt:

```dockerfile
# Pin to a specific digest and KEEP IT UPDATED (rebuild on base-image CVEs).
# `node:26-bookworm-slim` is an example; pin the digest you actually vet.
FROM node:26-bookworm-slim AS build
WORKDIR /app
# Install with a frozen lockfile and dependency scripts blocked (matches this
# app's .npmrc/pnpm-workspace.yaml posture).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod=false
COPY . .
RUN pnpm build

FROM node:26-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# Drop privileges: never run the app as root.
USER node
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/package.json ./
CMD ["node", "dist/src/index.js"]
```

Run it read-only with no privilege escalation (compose example; the k8s
equivalents are `securityContext.readOnlyRootFilesystem`,
`runAsNonRoot`, `allowPrivilegeEscalation: false`, and a writable `emptyDir` for
any temp/log paths):

```yaml
services:
  api:
    read_only: true
    tmpfs: ["/tmp"]
    security_opt: ["no-new-privileges:true"]
    cap_drop: ["ALL"]
```

Restrict egress with a Kubernetes NetworkPolicy so a compromised dependency can
only reach the dependencies it legitimately needs (Postgres, Redis, DNS) — not
the open internet:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-egress
spec:
  podSelector:
    matchLabels: { app: api }
  policyTypes: ["Egress"]
  egress:
    - to: [{ podSelector: { matchLabels: { app: postgres } } }]
    - to: [{ podSelector: { matchLabels: { app: redis } } }]
    # DNS
    - to: [{ namespaceSelector: {} }]
      ports: [{ protocol: UDP, port: 53 }, { protocol: TCP, port: 53 }]
    # Add explicit allow rules for any external host you genuinely call.
    # Everything else is denied by default.
```

Adapt all of the above to your platform, pin and update the base image, and
verify it yourself — treat it as a starting point, not a guarantee.

## Reporting a vulnerability in your app

Add your team's security contact and disclosure process here.
