import LocalizedText from '@models/LocalizedText.js'
import User from '@models/User.js'
import createHost from '@spec/factories/HostFactory.js'
import createHostPlace from '@spec/factories/HostPlaceFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createDen from '@spec/factories/Room/DenFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Host/LocalizedTextsController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  const update = async <StatusCode extends 204 | 400 | 404>(
    localizedText: LocalizedText,
    data: RequestBody<'patch', '/v1/host/localized-texts/{id}'>,
    expectedStatus: StatusCode,
  ) => {
    return request.patch('/v1/host/localized-texts/{id}', expectedStatus, {
      id: localizedText.id,
      data,
    })
  }

  const destroy = async <StatusCode extends 204 | 400 | 404>(
    localizedText: LocalizedText,
    expectedStatus: StatusCode,
  ) => {
    return request.delete('/v1/host/localized-texts/{id}', expectedStatus, {
      id: localizedText.id,
    })
  }

  context('a LocalizedText belonging to the current Host', () => {
    it('updates the LocalizedText', async () => {
      const host = await createHost({ user })
      const localizedText = await host.associationQuery('localizedTexts').firstOrFail()

      await update(
        localizedText,
        {
          locale: 'es-ES',
          title: 'Updated Host title',
          markdown: 'Updated Host markdown',
        },
        204,
      )

      await localizedText.reload()
      expect(localizedText.locale).toEqual('es-ES')
      expect(localizedText.title).toEqual('Updated Host title')
      expect(localizedText.markdown).toEqual('Updated Host markdown')
    })

    it('deletes the LocalizedText', async () => {
      const host = await createHost({ user })
      const localizedText = await host.associationQuery('localizedTexts').firstOrFail()

      await destroy(localizedText, 204)

      expect(await LocalizedText.find(localizedText.id)).toBeNull()
    })

    context('a LocalizedText belonging to another Host', () => {
      it('is not updated', async () => {
        await createHost({ user })
        const host = await createHost()
        const localizedText = await host.associationQuery('localizedTexts').firstOrFail()
        const originalLocale = localizedText.locale
        const originalTitle = localizedText.title
        const originalMarkdown = localizedText.markdown

        await update(
          localizedText,
          {
            locale: 'es-ES',
            title: 'Updated Host title',
            markdown: 'Updated Host markdown',
          },
          404,
        )

        await localizedText.reload()
        expect(localizedText.locale).toEqual(originalLocale)
        expect(localizedText.title).toEqual(originalTitle)
        expect(localizedText.markdown).toEqual(originalMarkdown)
      })

      it('is not deleted', async () => {
        await createHost({ user })
        const host = await createHost()
        const localizedText = await host.associationQuery('localizedTexts').firstOrFail()

        await destroy(localizedText, 404)

        expect(await LocalizedText.find(localizedText.id)).toMatchDreamModel(localizedText)
      })
    })
  })

  context('a LocalizedText belonging to a Place for the current Host', () => {
    it('updates the LocalizedText', async () => {
      const host = await createHost({ user })
      const place = await createPlace()
      await createHostPlace({ host, place })
      const localizedText = await place.associationQuery('localizedTexts').firstOrFail()

      await update(
        localizedText,
        {
          locale: 'es-ES',
          title: 'Updated Place title',
          markdown: 'Updated Place markdown',
        },
        204,
      )

      await localizedText.reload()
      expect(localizedText.locale).toEqual('es-ES')
      expect(localizedText.title).toEqual('Updated Place title')
      expect(localizedText.markdown).toEqual('Updated Place markdown')
    })

    it('deletes the LocalizedText', async () => {
      const host = await createHost({ user })
      const place = await createPlace()
      await createHostPlace({ host, place })
      const localizedText = await place.associationQuery('localizedTexts').firstOrFail()

      await destroy(localizedText, 204)

      expect(await LocalizedText.find(localizedText.id)).toBeNull()
    })

    context('a LocalizedText belonging to a Place for another Host', () => {
      it('is not updated', async () => {
        await createHost({ user })
        const place = await createPlace()
        const localizedText = await place.associationQuery('localizedTexts').firstOrFail()
        const originalLocale = localizedText.locale
        const originalTitle = localizedText.title
        const originalMarkdown = localizedText.markdown

        await update(
          localizedText,
          {
            locale: 'es-ES',
            title: 'Updated Place title',
            markdown: 'Updated Place markdown',
          },
          404,
        )

        await localizedText.reload()
        expect(localizedText.locale).toEqual(originalLocale)
        expect(localizedText.title).toEqual(originalTitle)
        expect(localizedText.markdown).toEqual(originalMarkdown)
      })

      it('is not deleted', async () => {
        await createHost({ user })
        const place = await createPlace()
        const localizedText = await place.associationQuery('localizedTexts').firstOrFail()

        await destroy(localizedText, 404)

        expect(await LocalizedText.find(localizedText.id)).toMatchDreamModel(localizedText)
      })
    })
  })

  context('a LocalizedText belonging to a Room for a Place for the current Host', () => {
    it('updates the LocalizedText', async () => {
      const host = await createHost({ user })
      const place = await createPlace()
      await createHostPlace({ host, place })
      const room = await createDen({ place })
      const localizedText = await room.associationQuery('localizedTexts').firstOrFail()

      await update(
        localizedText,
        {
          locale: 'es-ES',
          title: 'Updated Room title',
          markdown: 'Updated Room markdown',
        },
        204,
      )

      await localizedText.reload()
      expect(localizedText.locale).toEqual('es-ES')
      expect(localizedText.title).toEqual('Updated Room title')
      expect(localizedText.markdown).toEqual('Updated Room markdown')
    })

    it('deletes the LocalizedText', async () => {
      const host = await createHost({ user })
      const place = await createPlace()
      await createHostPlace({ host, place })
      const room = await createDen({ place })
      const localizedText = await room.associationQuery('localizedTexts').firstOrFail()

      await destroy(localizedText, 204)

      expect(await LocalizedText.find(localizedText.id)).toBeNull()
    })

    context('a LocalizedText belonging to a Room for another Host', () => {
      it('is not updated', async () => {
        await createHost({ user })
        const room = await createDen()
        const localizedText = await room.associationQuery('localizedTexts').firstOrFail()
        const originalLocale = localizedText.locale
        const originalTitle = localizedText.title
        const originalMarkdown = localizedText.markdown

        await update(
          localizedText,
          {
            locale: 'es-ES',
            title: 'Updated Room title',
            markdown: 'Updated Room markdown',
          },
          404,
        )

        await localizedText.reload()
        expect(localizedText.locale).toEqual(originalLocale)
        expect(localizedText.title).toEqual(originalTitle)
        expect(localizedText.markdown).toEqual(originalMarkdown)
      })

      it('is not deleted', async () => {
        await createHost({ user })
        const room = await createDen()
        const localizedText = await room.associationQuery('localizedTexts').firstOrFail()

        await destroy(localizedText, 404)

        expect(await LocalizedText.find(localizedText.id)).toMatchDreamModel(localizedText)
      })
    })
  })
})
