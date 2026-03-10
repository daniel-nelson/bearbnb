import Place from '@models/Place.js'
import Room from '@models/Room.js'
import Kitchen from '@models/Room/Kitchen.js'
import User from '@models/User.js'
import createHost from '@spec/factories/HostFactory.js'
import createHostPlace from '@spec/factories/HostPlaceFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createKitchen from '@spec/factories/Room/KitchenFactory.js'
import createUser from '@spec/factories/UserFactory.js'
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

    it('returns the specified Room', async () => {
      const room = await createKitchen({ place })

      const { body } = await show(room, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: room.id,
          type: room.type,
          position: room.position,
        }),
      )
    })

    context('Room created by another Place', () => {
      it('is not found', async () => {
        const otherPlaceRoom = await createKitchen()

        await show(otherPlaceRoom, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/host/places/{placeId}/rooms'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/host/places/{placeId}/rooms', expectedStatus, {
        placeId: place.id,
        data
      })
    }

    it('creates a Room for this Place', async () => {
      const { body } = await create({
        type: 'Kitchen',
        appliances: ['oven', 'stove'],
      }, 201)

      const room = await place.associationQuery('rooms').firstOrFail()
      expect(room.type).toEqual('Kitchen')
      expect((room as Kitchen).appliances).toEqual(['oven', 'stove'])

      expect(body).toEqual(
        expect.objectContaining({
          id: room.id,
          type: 'Kitchen',
          appliances: ['oven', 'stove'],
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
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

    it('updates the Room', async () => {
      const room = await createKitchen({ place, appliances: ['microwave'] })

      await update(room, {
        appliances: ['dishwasher'],
      }, 204)

      await room.reload()
      expect(room.appliances).toEqual(['dishwasher'])
    })

    context('a Room created by another Place', () => {
      it('is not updated', async () => {
        const room = await createKitchen({ appliances: ['microwave'] })

        await update(room, {
          appliances: ['dishwasher'],
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
