import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

type Service = {
  name: string
  command: string
  args: string[]
}

const apiRoot = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))

const services: Service[] = [
  { name: 'firebase', command: 'pnpm', args: ['firebase:dev'] },
  { name: 'web', command: 'pnpm', args: ['web:dev'] },
  { name: 'worker', command: 'pnpm', args: ['worker:dev'] },
  { name: 'ws', command: 'pnpm', args: ['ws:dev'] },
  { name: 'client', command: 'pnpm', args: ['client'] },
]

const children = services.map(service => {
  const child = spawn(service.command, service.args, {
    cwd: apiRoot,
    env: process.env,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  })

  if (child.pid === undefined) {
    throw new Error(`Failed to start ${service.name}`)
  }

  return { service, child }
})

let stopping = false

async function stopAll() {
  if (stopping) return
  stopping = true

  for (const { child } of children) {
    if (child.pid === undefined) continue

    try {
      if (process.platform === 'win32') {
        child.kill('SIGTERM')
      } else {
        process.kill(-child.pid, 'SIGTERM')
      }
    } catch {
      // Process may already be gone.
    }
  }

  await Promise.allSettled(
    children.map(
      ({ child }) =>
        new Promise<void>(resolve => {
          if (child.exitCode !== null || child.signalCode !== null) {
            resolve()
            return
          }

          child.once('exit', () => resolve())
        }),
    ),
  )
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void stopAll().then(() => {
      process.exit(signal === 'SIGINT' ? 130 : 143)
    })
  })
}

const firstExit = await Promise.race(
  children.map(
    ({ service, child }) =>
      new Promise<{ name: string; code: number | null; signal: NodeJS.Signals | null }>(resolve => {
        child.once('exit', (code, signal) => {
          resolve({ name: service.name, code, signal })
        })
      }),
  ),
)

await stopAll()

const exitCode = firstExit.code ?? (firstExit.signal ? 128 : 1)
process.exit(exitCode)
