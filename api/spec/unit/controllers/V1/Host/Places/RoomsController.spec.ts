import Kitchen from '@models/Room/Kitchen.js'
import Room from '@models/Room.js'
import User from '@models/User.js'
import Place from '@models/Place.js'
import createHost from '@spec/factories/HostFactory.js'
import createHostPlace from '@spec/factories/HostPlaceFactory.js'
import createKitchen from '@spec/factories/Room/KitchenFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Host/Places/RoomsController', () => {
  let request: SpecRequestType
  let user: User
  let place: Place

  beforeEach(async () => {
    user = await createUser()
    const host = await createHost({ user })
    place = await createPlace()
    await createHostPlace({ host, place })
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/host/places/{placeId}/rooms', expectedStatus, {
        placeId: place.id,
      })
    }

    it('returns the index of Rooms', async () => {
      const room = await createKitchen({ place })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: room.id,
        }),
      ])
    })

    context('Rooms created by another Place', () => {
      it('are omitted', async () => {
        await createKitchen()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(room: Room, expectedStatus: StatusCode) => {
      return request.get('/v1/host/places/{placeId}/rooms/{id}', expectedStatus, {
        placeId: place.id,
        id: room.id,
      })
    }

    it('returns the specified Room with localized text rows and type-specific fields', async () => {
      const room = await createKitchen({ place, appliances: ['oven'] })

      const { body } = await show(room, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: room.id,
          type: 'Kitchen',
          position: room.position,
          appliances: ['oven'],
        }),
      )

      // localized text rows for editing/display (the auto-created en-US row)
      expect(body.localizedTexts).toEqual([expect.objectContaining({ locale: 'en-US' })])
    })

    context('Room created by another Place', () => {
      it('is not found', async () => {
        const otherPlaceRoom = await createKitchen()

        await show(otherPlaceRoom, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404 | 422>(
      data: RequestBody<'post', '/v1/host/places/{placeId}/rooms'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/host/places/{placeId}/rooms', expectedStatus, {
        placeId: place.id,
        data
      })
    }

    it('creates a typed Room for this Place with multi-locale localized text', async () => {
      const { body } = await create({
        type: 'Kitchen',
        appliances: ['oven', 'stove'],
        localizedTexts: [
          { locale: 'en-US', title: 'Chef kitchen', markdown: 'Fully equipped' },
          { locale: 'es-ES', title: 'Cocina de chef', markdown: 'Totalmente equipada' },
        ],
      }, 201)

      const room = await place.associationQuery('rooms').firstOrFail()
      expect(room.type).toEqual('Kitchen')
      expect((room as Kitchen).appliances).toEqual(['oven', 'stove'])

      const localizedTexts = await room.associationQuery('localizedTexts').order('locale').all()
      expect(localizedTexts.map(text => [text.locale, text.title, text.markdown])).toEqual([
        ['en-US', 'Chef kitchen', 'Fully equipped'],
        ['es-ES', 'Cocina de chef', 'Totalmente equipada'],
      ])

      expect(body).toEqual(
        expect.objectContaining({
          id: room.id,
          type: 'Kitchen',
          appliances: ['oven', 'stove'],
        }),
      )
    })

    it('creates a Room with only the default locale', async () => {
      await create({
        type: 'Den',
        localizedTexts: [{ locale: 'en-US', title: 'Cozy den', markdown: 'A warm space' }],
      }, 201)

      const room = await place.associationQuery('rooms').firstOrFail()
      expect(room.type).toEqual('Den')

      const localizedTexts = await room.associationQuery('localizedTexts').all()
      expect(localizedTexts.map(text => text.locale)).toEqual(['en-US'])
    })

    it('returns 422 when the default-locale title and description are missing', async () => {
      await create({
        type: 'Kitchen',
        localizedTexts: [{ locale: 'es-ES', title: 'Cocina', markdown: 'Equipada' }],
      }, 422)

      expect(await place.associationQuery('rooms').first()).toBeNull()
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404 | 422>(
      room: Room,
      data: RequestBody<'patch', '/v1/host/places/{placeId}/rooms/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/v1/host/places/{placeId}/rooms/{id}', expectedStatus, {
        placeId: place.id,
        id: room.id,
        data,
      })
    }

    it('updates the Room type-specific fields and default-locale text', async () => {
      const room = await createKitchen({ place, appliances: ['microwave'] })

      await update(room, {
        appliances: ['dishwasher'],
        localizedTexts: [{ locale: 'en-US', title: 'Updated title', markdown: 'Updated body' }],
      }, 204)

      await room.reload()
      expect(room.appliances).toEqual(['dishwasher'])

      const localizedTexts = await room.associationQuery('localizedTexts').order('locale').all()
      expect(localizedTexts.map(text => [text.locale, text.title, text.markdown])).toEqual([
        ['en-US', 'Updated title', 'Updated body'],
      ])
    })

    it('adds a non-default locale row', async () => {
      const room = await createKitchen({ place })

      await update(room, {
        localizedTexts: [
          { locale: 'en-US', title: 'English title', markdown: 'English body' },
          { locale: 'es-ES', title: 'Título', markdown: 'Cuerpo' },
        ],
      }, 204)

      const localizedTexts = await room.associationQuery('localizedTexts').order('locale').all()
      expect(localizedTexts.map(text => [text.locale, text.title, text.markdown])).toEqual([
        ['en-US', 'English title', 'English body'],
        ['es-ES', 'Título', 'Cuerpo'],
      ])
    })

    it('removes a non-default locale row omitted from the payload', async () => {
      const room = await createKitchen({ place })
      await room.createAssociation('localizedTexts', { locale: 'es-ES', title: 'Título', markdown: 'Cuerpo' })

      await update(room, {
        localizedTexts: [{ locale: 'en-US', title: 'English title', markdown: 'English body' }],
      }, 204)

      const localizedTexts = await room.associationQuery('localizedTexts').order('locale').all()
      expect(localizedTexts.map(text => text.locale)).toEqual(['en-US'])
    })

    it('returns 422 when the default-locale title and description are missing', async () => {
      const room = await createKitchen({ place, appliances: ['microwave'] })

      await update(room, {
        appliances: ['dishwasher'],
        localizedTexts: [{ locale: 'es-ES', title: 'Título', markdown: 'Cuerpo' }],
      }, 422)

      await room.reload()
      expect(room.appliances).toEqual(['microwave'])
    })

    context('a Room created by another Place', () => {
      it('is not updated', async () => {
        const room = await createKitchen({ appliances: ['microwave'] })

        await update(room, {
          appliances: ['dishwasher'],
          localizedTexts: [{ locale: 'en-US', title: 'Updated title', markdown: 'Updated body' }],
        }, 404)

        await room.reload()
        expect(room.appliances).toEqual(['microwave'])
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(room: Room, expectedStatus: StatusCode) => {
      return request.delete('/v1/host/places/{placeId}/rooms/{id}', expectedStatus, {
        placeId: place.id,
        id: room.id,
      })
    }

    it('deletes the Room', async () => {
      const room = await createKitchen({ place })

      await destroy(room, 204)

      expect(await Room.find(room.id)).toBeNull()
    })

    context('a Room created by another Place', () => {
      it('is not deleted', async () => {
        const room = await createKitchen()

        await destroy(room, 404)

        expect(await Room.find(room.id)).toMatchDreamModel(room)
      })
    })
  })
})
