import AppEnv from '@conf/AppEnv.js'

export default function allowedCorsOrigins() {
  const raw = AppEnv.string('CORS_HOSTS', { optional: true }) || '[]'
  try {
    return JSON.parse(raw) as string[]
  } catch (err) {
    throw new Error(
      `CORS_HOSTS must be a JSON-encoded array of origin URLs (e.g. ["https://app.example.com"]). ` +
        `Received: ${raw}. Original parse error: ${(err as Error).message}`,
    )
  }
}
