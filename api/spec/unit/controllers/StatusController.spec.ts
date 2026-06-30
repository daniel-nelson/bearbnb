import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('StatusController', () => {
  let request: OpenapiSpecRequest<OpenapiPaths>

  beforeEach(async () => {
    request = new OpenapiSpecRequest<OpenapiPaths>()
    await request.init(PsychicServer)
  })

  describe('GET show', () => {
    it('returns the API status without authentication', async () => {
      const { body } = await request.get('/status', 200)

      expect(body).toEqual({ status: 'ok' })
    })
  })
})
