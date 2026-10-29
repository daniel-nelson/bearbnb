import { client } from './generated/client.gen'

function baseUrl() {
  // VITE_API_HOST points the client at any Psychic API. Otherwise, the feature
  // specs (VITE_PSYCHIC_ENV=test) talk to the API server the spec hooks start on
  // port 7778, and development to `pnpm web:dev` on port 7777.
  if (import.meta.env.VITE_API_HOST) return import.meta.env.VITE_API_HOST as string

  return import.meta.env.VITE_PSYCHIC_ENV === 'test' ? 'http://localhost:7778' : 'http://localhost:7777'
}

client.setConfig({
  baseUrl: baseUrl(),
  credentials: 'omit',
})
