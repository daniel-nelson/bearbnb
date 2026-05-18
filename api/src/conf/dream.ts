import { DreamApp } from '@rvoh/dream'
import { PsychicApp } from '@rvoh/psychic'
import { type DreamDbConfig } from '@rvoh/dream/types'

import AppEnv from '@conf/AppEnv.js'
import inflections from '@conf/inflections.js'
import importAll from '@conf/system/importAll.js'
import importDefault from '@conf/system/importDefault.js'
import srcPath from '@conf/system/srcPath.js'
import { debuglog } from 'node:util'

// Enable debug logging with NODE_DEBUG=sql
const debugSql = debuglog('sql').enabled

export default async (app: DreamApp) => {
  app.set('primaryKeyType', 'uuid7')
  app.set('inflections', inflections)

  await app.load('models', srcPath('app', 'models'), path => importDefault(path))
  await app.load('serializers', srcPath('app', 'serializers'), path => importAll(path))

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  app.set('paths', {})

  app.set('parallelTests', AppEnv.integer('DREAM_PARALLEL_TESTS', { optional: true }) || 1)

  // Verified TLS to Postgres via Node's system CA store. Works out of the box
  // with managed providers that present a public-CA-signed certificate
  // (Supabase, Neon, Render, Azure Database for PostgreSQL Flexible Server).
  //
  // If your provider uses a private CA, add its bundle:
  //   - AWS RDS:       `ssl: { rejectUnauthorized: true, ca: readFileSync('rds-ca.pem') }`
  //                    https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html
  //   - GCP Cloud SQL: `ssl: { rejectUnauthorized: true, ca: readFileSync('server-ca.pem') }`
  //                    https://cloud.google.com/sql/docs/postgres/connect-overview#secure
  //
  // For providers that present a self-signed certificate (Heroku Hobby tier
  // and some local Docker images), drop verification:
  //   `ssl: { rejectUnauthorized: false }` — encrypted but unauthenticated.
  //
  // Set `DB_NO_SSL=true` to disable TLS entirely (local dev only).
  const dbSsl: { rejectUnauthorized: true } | false = AppEnv.boolean('DB_NO_SSL')
    ? false
    : { rejectUnauthorized: true }

  // node-postgres defaults are unprotective; override the ones that matter.
  // To add statement_timeout / query_timeout / idle_in_transaction_session_timeout,
  // prefer `ALTER ROLE myapp SET ...` on the Postgres role so long migrations
  // aren't aborted, or add them here for an app-wide default.
  const dbConnectionDefaults: NonNullable<DreamDbConfig['pg']> = {
    connectionTimeoutMillis: AppEnv.integer('DB_CONNECTION_TIMEOUT_MS', { optional: true }) || 5000, // pg default 0 = wait forever on an exhausted pool
    application_name: AppEnv.string('APP_NAME', { optional: true }) || 'bearbnb', // visible in pg_stat_activity; aids incident response
    keepAlive: true, // detects dead connections behind a load balancer or NAT
  }

  app.set('db', {
    primary: {
      user: AppEnv.string('DB_USER'),
      password: AppEnv.string('DB_PASSWORD', { optional: !AppEnv.isProduction }),
      host: AppEnv.string('DB_HOST'),
      name: AppEnv.string('DB_NAME'),
      port: AppEnv.integer('DB_PORT'),
      ssl: dbSsl,
      pg: dbConnectionDefaults,
    },
    replica: AppEnv.string('REPLICA_DB_HOST', { optional: true })
      ? {
          user: AppEnv.string('DB_USER'),
          password: AppEnv.string('DB_PASSWORD', { optional: !AppEnv.isProduction }),
          host: AppEnv.string('REPLICA_DB_HOST'),
          name: AppEnv.string('DB_NAME'),
          port: AppEnv.integer('REPLICA_DB_PORT', { optional: true }) || AppEnv.integer('DB_PORT'),
          ssl: dbSsl,
          pg: dbConnectionDefaults,
        }
      : undefined,
  })

  app.set('encryption', {
    columns: {
      current: {
        algorithm: 'aes-256-gcm',
        key: AppEnv.string('COLUMN_ENCRYPTION_KEY'),
      },
    },
  })

  app.on('db:log', event => {
    if (!debugSql) return

    if (event.level === 'error') {
      PsychicApp.logWithLevel('error', 'the following db query encountered an unexpected error: ', {
        durationMs: event.queryDurationMillis,
        error: event.error,
        sql: event.query.sql,
        params: event.query.parameters.map(maskPII),
      })
    } else {
      PsychicApp.log('db query completed:', {
        durationMs: event.queryDurationMillis,
        sql: event.query.sql,
        params: event.query.parameters.map(maskPII),
      })
    }
  })
}

function maskPII(data: unknown) {
  return data
}
