import { spawnSync } from 'node:child_process'

const vitestArgs = process.argv.slice(2)
const shellQuote = value => `'${value.replaceAll("'", "'\\''")}'`
const runVisible = process.env.HEADLESS === '0'

const vitestCommand = [
  'cross-env',
  ...(runVisible ? ['HEADLESS=0'] : ['APP_NAME=$npm_package_name', 'APP_VERSION=$npm_package_version']),
  runVisible ? 'vitest run' : 'vitest',
  '--config=./spec/features/vite.config.ts',
  ...vitestArgs.map(shellQuote),
].join(' ')

const result = spawnSync(
  'firebase',
  [
    'emulators:exec',
    '--only',
    'auth',
    '--project',
    'demo-bearbnb',
    `pnpm psy db:integrity-check && ${vitestCommand}`,
  ],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
