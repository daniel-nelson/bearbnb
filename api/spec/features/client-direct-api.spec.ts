import AppEnv from '@conf/AppEnv.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('client direct API access', () => {
  it('calls the Psychic API from the browser without a frontend proxy', async () => {
    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await expect(page).toMatchTextContent('Psychic API')
    await expect(page).toMatchTextContent('Connected')
    await expect(page).toMatchTextContent('http://localhost:7778')
  })
})
