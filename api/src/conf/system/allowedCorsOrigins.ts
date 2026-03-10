import AppEnv from '@conf/AppEnv.js'

export default function allowedCorsOrigins() {
  return JSON.parse(AppEnv.string('CORS_HOSTS', { optional: true }) || '[]') as string[]
}
