import { DateTime } from '@rvoh/dream'
import User from '@models/User.js'
import createHost from '@spec/factories/HostFactory.js'
import createLocalizedText from '@spec/factories/LocalizedTextFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/HostController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/host', expectedStatus)
    }

    it('returns the Host belonging to the User, including its localized profile text', async () => {
      const host = await createHost({ user, legalName: 'Björn Realty LLC' })
      const enText = await host.associationQuery('localizedTexts', { and: { locale: 'en-US' } }).firstOrFail()
      await enText.update({ title: 'Björn', markdown: 'Cozy bear host' })
      const esText = await createLocalizedText({
        localizable: host,
        locale: 'es-ES',
        title: 'Oso',
        markdown: 'Anfitrión acogedor',
      })

      const { body } = await show(200)

      expect(body).toEqual(
        expect.objectContaining({
          id: host.id,
          legalName: 'Björn Realty LLC',
          signedHostAgreementAt: host.signedHostAgreementAt.toISO(),
        }),
      )
      expect(body.localizedTexts.map(text => text.id).sort()).toEqual([enText.id, esText.id].sort())
    })

    it('returns 404 when the current User has no Host', async () => {
      await show(404)
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404 | 422>(
      data: RequestBody<'post', '/v1/host'>,
      expectedStatus: StatusCode,
    ) => {
      return request.post('/v1/host', expectedStatus, { data })
    }

    it('creates a Host for the User with legal fields and multi-locale profile text', async () => {
      const now = DateTime.now()

      const { body } = await create(
        {
          legalName: 'Björn Realty LLC',
          signedHostAgreementAt: now.toISO(),
          localizedTexts: [
            { locale: 'en-US', title: 'Björn', markdown: 'Cozy bear host' },
            { locale: 'es-ES', title: 'Oso', markdown: 'Anfitrión acogedor' },
          ],
        },
        201,
      )

      const host = await user.associationQuery('host').firstOrFail()
      expect(host.legalName).toEqual('Björn Realty LLC')
      expect(host.signedHostAgreementAt).toEqualDateTime(now)

      const localizedTexts = await host.associationQuery('localizedTexts').order('locale').all()
      expect(localizedTexts.map(text => [text.locale, text.title, text.markdown])).toEqual([
        ['en-US', 'Björn', 'Cozy bear host'],
        ['es-ES', 'Oso', 'Anfitrión acogedor'],
      ])

      expect(body).toEqual(expect.objectContaining({ id: host.id, legalName: 'Björn Realty LLC' }))
      expect(body?.localizedTexts).toHaveLength(2)
    })

    it('returns 422 when the default-locale title and description are missing', async () => {
      await create(
        {
          legalName: 'Björn Realty LLC',
          signedHostAgreementAt: DateTime.now().toISO(),
          localizedTexts: [{ locale: 'es-ES', title: 'Oso', markdown: 'Anfitrión acogedor' }],
        },
        422,
      )

      expect(await user.associationQuery('host').first()).toBeNull()
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      data: RequestBody<'patch', '/v1/host'>,
      expectedStatus: StatusCode,
    ) => {
      return request.patch('/v1/host', expectedStatus, { data })
    }

    it('updates legal fields and upserts the default-locale profile text', async () => {
      const lastHour = DateTime.now().minus({ hour: 1 })
      const host = await createHost({ user })

      await update(
        {
          legalName: 'Updated Realty',
          signedHostAgreementAt: lastHour.toISO(),
          localizedTexts: [{ locale: 'en-US', title: 'New title', markdown: 'New body' }],
        },
        204,
      )

      await host.reload()
      expect(host.legalName).toEqual('Updated Realty')
      expect(host.signedHostAgreementAt).toEqualDateTime(lastHour)

      const enText = await host.associationQuery('localizedTexts', { and: { locale: 'en-US' } }).firstOrFail()
      expect([enText.title, enText.markdown]).toEqual(['New title', 'New body'])
    })

    it('adds a non-default locale and removes non-default locales no longer provided', async () => {
      const host = await createHost({ user })
      await createLocalizedText({ localizable: host, locale: 'es-ES', title: 'Oso', markdown: 'viejo' })

      await update(
        {
          legalName: host.legalName,
          signedHostAgreementAt: host.signedHostAgreementAt.toISO(),
          localizedTexts: [{ locale: 'en-US', title: 'Björn', markdown: 'Cozy bear host' }],
        },
        204,
      )

      const locales = (await host.associationQuery('localizedTexts').all()).map(text => text.locale)
      expect(locales).toEqual(['en-US'])
    })

    it('retains the en-US fallback even when no localized texts are provided', async () => {
      const host = await createHost({ user })
      const enText = await host.associationQuery('localizedTexts', { and: { locale: 'en-US' } }).firstOrFail()
      await enText.update({ title: 'Keep me', markdown: 'stays' })

      await update(
        {
          legalName: host.legalName,
          signedHostAgreementAt: host.signedHostAgreementAt.toISO(),
          localizedTexts: [],
        },
        204,
      )

      await enText.reload()
      expect(enText.title).toEqual('Keep me')
    })
  })

  describe('when the requested Host does not exist', () => {
    it('update returns 404', async () => {
      await request.patch('/v1/host', 404, {
        data: { legalName: 'x', signedHostAgreementAt: DateTime.now().toISO(), localizedTexts: [] },
      })
    })
  })
})
