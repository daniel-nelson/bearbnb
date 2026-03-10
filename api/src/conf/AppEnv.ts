import { Env } from '@rvoh/dream'

class AppEnvClass extends Env<{
  boolean: 'CONSOLE_SERVICE' | 'CLIENT' | 'DB_NO_SSL' | 'REQUEST_LOGGING' | 'WEB_SERVICE' | 'WS_SERVICE' | 'WORKER_SERVICE'

  integer: 'BG_JOBS_REDIS_PORT' | 'DB_PORT' | 'WS_PORT' | 'DREAM_PARALLEL_TESTS' | 'REPLICA_DB_PORT' | 'WS_REDIS_PORT'

  string:
    | 'APP_ENCRYPTION_KEY'
    | 'BG_JOBS_REDIS_HOST'
    | 'BG_JOBS_REDIS_PASSWORD'
    | 'BG_JOBS_REDIS_USERNAME'
    | 'COLUMN_ENCRYPTION_KEY'
    | 'CORS_HOSTS'
    | 'DB_HOST'
    | 'DB_NAME'
    | 'DB_PASSWORD'
    | 'DB_USER'
    | 'REPLICA_DB_HOST'
    | 'SSL_CERT_PATH'
    | 'SSL_KEY_PATH'
    | 'WS_REDIS_HOST'
    | 'WS_REDIS_PASSWORD'
    | 'WS_REDIS_USERNAME'
}> {
  public get serviceRole(): ServiceRole {
    return AppEnv.boolean('WS_SERVICE')
      ? 'websockets'
      : AppEnv.boolean('WEB_SERVICE')
        ? 'web'
        : AppEnv.boolean('WORKER_SERVICE')
          ? 'worker'
          : 'unknown'
  }
}

type ServiceRole = 'websockets' | 'web' | 'worker' | 'unknown'

const AppEnv = new AppEnvClass()
export default AppEnv
