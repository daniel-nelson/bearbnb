import Place from '@models/Place.js'
import User from '@models/User.js'
import Host from '@models/Host.js'
import createHostPlace from '@spec/factories/HostPlaceFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createBedroom from '@spec/factories/Room/BedroomFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import createHost from '@spec/factories/HostFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Host/PlacesController', () => {
  let request: SpecRequestType
  let user: User
  let host: Host

  beforeEach(async () => {
    user = await createUser()
    host = await createHost({ user })
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/host/places', expectedStatus)
    }

    it('returns the index of Places', async () => {
      const place = await createPlace()
      await createHostPlace({ host, place })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: place.id,
          name: place.name,
        }),
      ])
    })

    context('Places created by another Host', () => {
      it('are omitted', async () => {
        await createPlace()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(place: Place, expectedStatus: StatusCode) => {
      return request.get('/v1/host/places/{id}', expectedStatus, {
        id: place.id,
      })
    }

    it('returns the specified Place with localized text rows and embedded Rooms', async () => {
      const place = await createPlace()
      await createHostPlace({ host, place })
      const bedroom = await createBedroom({ place })

      const { body } = await show(place, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: place.id,
          name: place.name,
          style: place.style,
          sleeps: place.sleeps,
        }),
      )

      // localized text rows for editing/display (the auto-created en-US row)
      expect(body.localizedTexts).toEqual([
        expect.objectContaining({ locale: 'en-US', title: `My ${place.style}` }),
      ])

      // embedded Rooms for the Place
      expect(body.rooms).toEqual([
        expect.objectContaining({ id: bedroom.id, type: 'Bedroom', position: bedroom.position }),
      ])
    })

    context('Place created by another Host', () => {
      it('is not found', async () => {
        const otherHostPlace = await createPlace()

        await show(otherHostPlace, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404 | 422>(
      data: RequestBody<'post', '/v1/host/places'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/host/places', expectedStatus, {
        data
      })
    }

    it('creates a Place for this Host with multi-locale localized text', async () => {
      const { body } = await create({
        name: 'The Place name',
        style: 'cottage',
        sleeps: 1,
        localizedTexts: [
          { locale: 'en-US', title: 'Cozy cottage', markdown: 'A warm den' },
          { locale: 'es-ES', title: 'Cabaña acogedora', markdown: 'Una guarida cálida' },
        ],
      }, 201)

      const place = await host.associationQuery('places').firstOrFail()
      expect(place.name).toEqual('The Place name')
      expect(place.style).toEqual('cottage')
      expect(place.sleeps).toEqual(1)

      const localizedTexts = await place.associationQuery('localizedTexts').order('locale').all()
      expect(localizedTexts.map(text => [text.locale, text.title, text.markdown])).toEqual([
        ['en-US', 'Cozy cottage', 'A warm den'],
        ['es-ES', 'Cabaña acogedora', 'Una guarida cálida'],
      ])

      expect(body).toEqual(
        expect.objectContaining({
          id: place.id,
          name: place.name,
          style: place.style,
          sleeps: place.sleeps,
        }),
      )
    })

    it('returns 422 when the default-locale title and description are missing', async () => {
      await create({
        name: 'The Place name',
        style: 'cottage',
        sleeps: 1,
        localizedTexts: [{ locale: 'es-ES', title: 'Cabaña', markdown: 'Una guarida' }],
      }, 422)

      expect(await host.associationQuery('places').first()).toBeNull()
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      place: Place,
      data: RequestBody<'patch', '/v1/host/places/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/v1/host/places/{id}', expectedStatus, {
        id: place.id,
        data,
      })
    }

    it('updates the Place', async () => {
      const place = await createPlace()
      await createHostPlace({ host, place })

      await update(place, {
        name: 'Updated Place name',
        style: 'dump',
        sleeps: 2,
      }, 204)

      await place.reload()
      expect(place.name).toEqual('Updated Place name')
      expect(place.style).toEqual('dump')
      expect(place.sleeps).toEqual(2)
    })

    context('a Place created by another Host', () => {
      it('is not updated', async () => {
        const place = await createPlace()
        const originalName = place.name
        const originalStyle = place.style
        const originalSleeps = place.sleeps

        await update(place, {
          name: 'Updated Place name',
          style: 'dump',
          sleeps: 2,
        }, 404)

        await place.reload()
        expect(place.name).toEqual(originalName)
        expect(place.style).toEqual(originalStyle)
        expect(place.sleeps).toEqual(originalSleeps)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(place: Place, expectedStatus: StatusCode) => {
      return request.delete('/v1/host/places/{id}', expectedStatus, {
        id: place.id,
      })
    }

    it('deletes the Place', async () => {
      const place = await createPlace()
      await createHostPlace({ host, place })

      await destroy(place, 204)

      expect(await Place.find(place.id)).toBeNull()
    })

    context('a Place created by another Host', () => {
      it('is not deleted', async () => {
        const place = await createPlace()

        await destroy(place, 404)

        expect(await Place.find(place.id)).toMatchDreamModel(place)
      })
    })
  })
})
