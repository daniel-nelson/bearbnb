import AppEnv from '@conf/AppEnv.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('client direct API access', () => {
  it('calls the Psychic API from the browser without a frontend proxy', async () => {
    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })
    const apiHost = 'http://localhost:7778'

    const result = await page.evaluate(async apiHost => {
      const response = await fetch(new URL('/status', apiHost), {
        headers: { Accept: 'application/json' },
      })
      const body = (await response.json()) as unknown

      return { apiHost, body, ok: response.ok }
    }, apiHost)

    expect(result).toEqual({
      apiHost,
      body: { status: 'ok' },
      ok: true,
    })
  })
})
