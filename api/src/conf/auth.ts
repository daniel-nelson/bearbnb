import AppEnv from '@conf/AppEnv.js'
import allowedCorsOrigins from '@conf/system/allowedCorsOrigins.js'
import { untypedDb } from '@rvoh/dream/db'
import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import { randomUUID } from 'node:crypto'

type BearbnbAuth = ReturnType<typeof buildAuth>

let auth: BearbnbAuth | undefined

export default function getAuth(): BearbnbAuth {
  auth ??= buildAuth()
  return auth
}

function buildAuth() {
  return betterAuth({
    appName: 'bearbnb',
    basePath: '/api/auth',
    baseURL:
      AppEnv.string('BETTER_AUTH_URL', { optional: true }) ||
      (AppEnv.isTest ? 'http://localhost:7778' : 'http://localhost:7777'),
    database: {
      db: untypedDb(),
      type: 'postgres',
      transaction: true,
    },
    emailAndPassword: {
      enabled: true,
    },
    plugins: [bearer()],
    secret:
      AppEnv.string('BETTER_AUTH_SECRET', { optional: !AppEnv.isProduction }) ||
      AppEnv.string('APP_ENCRYPTION_KEY'),
    trustedOrigins: allowedCorsOrigins(),
    advanced: {
      database: {
        generateId: ({ model }) => (model === 'user' || model === 'users' ? false : randomUUID()),
      },
    },
    user: {
      modelName: 'users',
    },
    session: {
      modelName: 'auth_sessions',
    },
    account: {
      modelName: 'auth_accounts',
    },
    verification: {
      modelName: 'auth_verifications',
    },
  })
}
