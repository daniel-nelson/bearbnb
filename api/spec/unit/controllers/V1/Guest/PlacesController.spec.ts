import { CalendarDate } from '@rvoh/dream'
import Place from '@models/Place.js'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import createBooking from '@spec/factories/BookingFactory.js'
import createFavorite from '@spec/factories/FavoriteFactory.js'
import createLocalizedText from '@spec/factories/LocalizedTextFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createBathroom from '@spec/factories/Room/BathroomFactory.js'
import createBedroom from '@spec/factories/Room/BedroomFactory.js'
import createDen from '@spec/factories/Room/DenFactory.js'
import createKitchen from '@spec/factories/Room/KitchenFactory.js'
import createLivingRoom from '@spec/factories/Room/LivingRoomFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { firebaseTestBearerToken, SpecRequestType } from '@spec/unit/helpers/authentication.js'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('V1/Guest/PlacesController', () => {
  let request: SpecRequestType

  beforeEach(async () => {
    request = new OpenapiSpecRequest<OpenapiPaths>()
    await request.init(PsychicServer)
    request.setDefaultHeaders({ 'accept-language': 'es-ES' })
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/v1/guest/places', expectedStatus)
    }

    it('returns the index of Places', async () => {
      const place = await createPlace()
      await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The Spanish title' })

      const { body } = await subject(200)

      expect(body.results).toEqual([
        {
          favoriteId: null,
          favorited: false,
          id: place.id,
          title: 'The Spanish title',
        },
      ])
    })

    it('marks places favorited by the current Guest when the request is authenticated', async () => {
      const user = await createUser()
      const guest = await user.associationQuery('guest').firstOrFail()
      const favorite = await createFavorite({ guest })
      await createLocalizedText({
        localizable: favorite.place,
        locale: 'es-ES',
        title: 'The favorited Spanish title',
      })
      const firebaseUid = user.firebaseUid ?? user.id
      await user.update({ firebaseUid })
      const authorization = `Bearer ${firebaseTestBearerToken({ uid: firebaseUid, email: user.email })}`
      request.setDefaultHeaders({ 'accept-language': 'es-ES', authorization })

      const { body } = await subject(200)

      expect(body.results).toEqual([
        {
          favoriteId: favorite.id,
          favorited: true,
          id: favorite.placeId,
          title: 'The favorited Spanish title',
        },
      ])
    })
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400>(place: Place, expectedStatus: StatusCode) => {
      return request.get('/v1/guest/places/{id}', expectedStatus, {
        id: place.id,
        headers: {
          'accept-language': 'es-ES',
        },
      })
    }

    it('returns places with rooms', async () => {
      const place = await createPlace({ style: 'cabin', sleeps: 3 })
      await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The Spanish place title' })

      const { kitchen, bathroom, bedroom, den, livingRoom } = await createRoomsForPlace(place)

      const { body } = await subject(place, 200)

      expect(body).toEqual({
        favoriteId: null,
        favorited: false,
        id: place.id,
        sleeps: 3,
        title: 'The Spanish place title',
        style: 'cabin',
        displayStyle: 'cabaña rústica',

        rooms: [
          {
            id: kitchen.id,
            type: 'Kitchen',
            displayType: 'cocina',
            title: 'The Spanish kitchen title',
            appliances: [
              {
                value: 'oven',
                label: 'horno',
              },
              {
                value: 'dishwasher',
                label: 'lavavajillas',
              },
            ],
          },
          {
            id: bathroom.id,
            type: 'Bathroom',
            displayType: 'baño',
            title: 'The Spanish bathroom title',
            bathOrShowerStyle: {
              value: 'shower',
              label: 'ducha',
            },
          },
          {
            id: bedroom.id,
            type: 'Bedroom',
            displayType: 'dormitorio',
            title: 'The Spanish bedroom title',
            bedTypes: [
              {
                value: 'cot',
                label: 'catre',
              },
              {
                value: 'bunk',
                label: 'litera',
              },
            ],
          },
          { id: den.id, type: 'Den', displayType: 'estudio', title: 'The Spanish den title' },
          {
            id: livingRoom.id,
            type: 'LivingRoom',
            displayType: 'sala de estar',
            title: 'The Spanish livingRoom title',
          },
        ],
      })
    })

    it('marks the place favorited by the current Guest when the request is authenticated', async () => {
      const user = await createUser()
      const guest = await user.associationQuery('guest').firstOrFail()
      const favorite = await createFavorite({ guest })
      const place = favorite.place
      await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The favorited place detail' })
      const firebaseUid = user.firebaseUid ?? user.id
      await user.update({ firebaseUid })
      const authorization = `Bearer ${firebaseTestBearerToken({ uid: firebaseUid, email: user.email })}`
      request.setDefaultHeaders({ 'accept-language': 'es-ES', authorization })

      const { body } = await subject(place, 200)

      expect(body).toEqual(
        expect.objectContaining({
          favoriteId: favorite.id,
          favorited: true,
          id: place.id,
          title: 'The favorited place detail',
        }),
      )
    })
  })

  describe('GET availability', () => {
    const subject = async <StatusCode extends 200 | 400>(place: Place, expectedStatus: StatusCode) => {
      return request.get('/v1/guest/places/{id}/availability', expectedStatus, {
        id: place.id,
      })
    }

    it('returns occupied booking ranges with checkout dates kept exclusive', async () => {
      const place = await createPlace()
      const startsOn = CalendarDate.fromISO('2026-07-01')
      const endsOn = CalendarDate.fromISO('2026-07-03')
      await createBooking({ place, startsOn, endsOn })

      const { body } = await subject(place, 200)

      expect(body).toEqual({
        occupiedRanges: [
          {
            startsOn: startsOn.toISO(),
            endsOn: endsOn.toISO(),
          },
        ],
      })
    })
  })
})

async function createRoomsForPlace(place: Place) {
  const kitchen = await createKitchen({ place, appliances: ['oven', 'dishwasher'] })
  await createLocalizedText({ localizable: kitchen, locale: 'es-ES', title: 'The Spanish kitchen title' })

  const bathroom = await createBathroom({ place, bathOrShowerStyle: 'shower' })
  await createLocalizedText({
    localizable: bathroom,
    locale: 'es-ES',
    title: 'The Spanish bathroom title',
  })

  const bedroom = await createBedroom({ place, bedTypes: ['cot', 'bunk'] })
  await createLocalizedText({ localizable: bedroom, locale: 'es-ES', title: 'The Spanish bedroom title' })

  const den = await createDen({ place })
  await createLocalizedText({ localizable: den, locale: 'es-ES', title: 'The Spanish den title' })

  const livingRoom = await createLivingRoom({ place })
  await createLocalizedText({
    localizable: livingRoom,
    locale: 'es-ES',
    title: 'The Spanish livingRoom title',
  })

  return { kitchen, bathroom, bedroom, den, livingRoom }
}
