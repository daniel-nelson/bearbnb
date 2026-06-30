import Place from '@models/Place.js'
import User from '@models/User.js'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import createLocalizedText from '@spec/factories/LocalizedTextFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createBathroom from '@spec/factories/Room/BathroomFactory.js'
import createBedroom from '@spec/factories/Room/BedroomFactory.js'
import createDen from '@spec/factories/Room/DenFactory.js'
import createKitchen from '@spec/factories/Room/KitchenFactory.js'
import createLivingRoom from '@spec/factories/Room/LivingRoomFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { session, SpecRequestType } from '@spec/unit/helpers/authentication.js'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('Visitor/V1/PlacesController', () => {
  describe('authenticated', () => {
    let request: SpecRequestType
    let user: User

    beforeEach(async () => {
      user = await createUser()
      request = await session(user)
    })

    describe('GET index', () => {
      const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
        return request.get('/v1/visitor/places', expectedStatus, {
          headers: {
            'accept-language': 'es-ES',
          },
        })
      }

      it('returns the index of Places', async () => {
        const place = await createPlace()
        await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The Spanish title' })

        const { body } = await subject(200)

        expect(body.results).toEqual([
          {
            id: place.id,
            title: 'The Spanish title',
          },
        ])
      })
    })

    describe('GET show', () => {
      const subject = async <StatusCode extends 200 | 400>(place: Place, expectedStatus: StatusCode) => {
        return request.get('/v1/visitor/places/{id}', expectedStatus, {
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

        expect(body).toEqual(expectedShowBody({ place, kitchen, bathroom, bedroom, den, livingRoom }))
      })
    })
  })

  describe('unauthenticated', () => {
    let request: OpenapiSpecRequest<OpenapiPaths>

    beforeEach(async () => {
      request = new OpenapiSpecRequest<OpenapiPaths>()
      await request.init(PsychicServer)
    })

    describe('GET index', () => {
      const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
        return request.get('/v1/visitor/places', expectedStatus, {
          headers: {
            'accept-language': 'es-ES',
          },
        })
      }

      it('returns the index of Places', async () => {
        const place = await createPlace()
        await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The Spanish title' })

        const { body } = await subject(200)

        expect(body.results).toEqual([
          {
            id: place.id,
            title: 'The Spanish title',
          },
        ])
      })
    })

    describe('GET show', () => {
      const subject = async <StatusCode extends 200 | 400>(place: Place, expectedStatus: StatusCode) => {
        return request.get('/v1/visitor/places/{id}', expectedStatus, {
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

        expect(body).toEqual(expectedShowBody({ place, kitchen, bathroom, bedroom, den, livingRoom }))
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

function expectedShowBody({
  place,
  kitchen,
  bathroom,
  bedroom,
  den,
  livingRoom,
}: Awaited<ReturnType<typeof createRoomsForPlace>> & { place: Place }) {
  return {
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
  }
}
