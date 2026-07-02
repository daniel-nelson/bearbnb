import Place from '@models/Place.js'
import Room from '@models/Room.js'
import User from '@models/User.js'
import { CalendarDate } from '@rvoh/dream'
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
      const subject = async <StatusCode extends 200 | 400>(
        expectedStatus: StatusCode,
        query: { q?: string } = {},
      ) => {
        return request.get('/v1/visitor/places', expectedStatus, {
          query,
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
            favoriteId: null,
            favorited: false,
            id: place.id,
            title: 'The Spanish title',
          },
        ])
      })

      it('filters Places by search query', async () => {
        const matchingPlace = await createPlace({ name: 'Riverbend Cabin' })
        await createLocalizedText({ localizable: matchingPlace, locale: 'es-ES', title: 'The River title' })

        await createPlace({ name: 'High Branch Treehouse' })

        const { body } = await subject(200, { q: 'river' })

        expect(body.results).toEqual([
          {
            favoriteId: null,
            favorited: false,
            id: matchingPlace.id,
            title: 'The River title',
          },
        ])
      })

      it('returns this Guest favorite metadata', async () => {
        const place = await createPlace()
        await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The Spanish title' })
        const guest = await user.associationQuery('guest').firstOrFail()
        const favorite = await createFavorite({ guest, place })

        const { body } = await subject(200)

        expect(body.results).toEqual([
          {
            favoriteId: favorite.id,
            favorited: true,
            id: place.id,
            title: 'The Spanish title',
          },
        ])
      })

      it('omits favorite metadata for another Guest', async () => {
        const place = await createPlace()
        await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The Spanish title' })
        await createFavorite({ place })

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

      it('returns this Guest favorite metadata', async () => {
        const place = await createPlace({ style: 'cabin', sleeps: 3 })
        await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'The Spanish place title' })
        const { kitchen, bathroom, bedroom, den, livingRoom } = await createRoomsForPlace(place)
        const guest = await user.associationQuery('guest').firstOrFail()
        const favorite = await createFavorite({ guest, place })

        const { body } = await subject(place, 200)

        expect(body).toEqual(
          expectedShowBody({ place, kitchen, bathroom, bedroom, den, livingRoom, favoriteId: favorite.id }),
        )
      })
    })

    // Visitor-facing localized content falls back to the always-present en-US
    // LocalizedText when the requested locale has no row, so a Host can save partial
    // non-default translations without blanking Visitor pages. Both cases are covered:
    // the requested locale exists and overrides the fallback, and it is missing and
    // returns en-US.
    describe('en-US fallback for the requested locale', () => {
      async function setEnglishTitle(owner: Place | Room, title: string) {
        const en = await owner.associationQuery('localizedTexts').firstOrFail()
        await en.update({ title })
        return en
      }

      describe('GET index', () => {
        it('falls back to the en-US title when the requested locale has no LocalizedText', async () => {
          const place = await createPlace()
          await setEnglishTitle(place, 'English index title')

          const { body } = await request.get('/v1/visitor/places', 200, {
            headers: { 'accept-language': 'es-ES' },
          })

          expect(body.results).toEqual([
            { favoriteId: null, favorited: false, id: place.id, title: 'English index title' },
          ])
        })

        it('uses the requested-locale title when it exists, overriding the en-US fallback', async () => {
          const place = await createPlace()
          await setEnglishTitle(place, 'English index title')
          await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'Título en español' })

          const { body } = await request.get('/v1/visitor/places', 200, {
            headers: { 'accept-language': 'es-ES' },
          })

          expect(body.results).toEqual([
            { favoriteId: null, favorited: false, id: place.id, title: 'Título en español' },
          ])
        })
      })

      describe('GET show', () => {
        it('falls back to the en-US title for the Place and its Rooms when the requested locale is missing', async () => {
          const place = await createPlace({ style: 'cabin', sleeps: 2 })
          await setEnglishTitle(place, 'English place title')

          const den = await createDen({ place })
          await setEnglishTitle(den, 'English den title')

          const { body } = await request.get('/v1/visitor/places/{id}', 200, {
            id: place.id,
            headers: { 'accept-language': 'es-ES' },
          })

          expect(body.title).toEqual('English place title')
          // Code-driven enum labels (displayType) still translate to Spanish; only the
          // data-driven LocalizedText title falls back to en-US.
          expect(body.rooms).toEqual([
            { id: den.id, type: 'Den', displayType: 'estudio', title: 'English den title' },
          ])
        })

        it('uses the requested-locale title when it exists, overriding the en-US fallback', async () => {
          const place = await createPlace({ style: 'cabin', sleeps: 2 })
          await setEnglishTitle(place, 'English place title')
          await createLocalizedText({ localizable: place, locale: 'es-ES', title: 'Título del lugar' })

          const den = await createDen({ place })
          await setEnglishTitle(den, 'English den title')
          await createLocalizedText({ localizable: den, locale: 'es-ES', title: 'Título del estudio' })

          const { body } = await request.get('/v1/visitor/places/{id}', 200, {
            id: place.id,
            headers: { 'accept-language': 'es-ES' },
          })

          expect(body.title).toEqual('Título del lugar')
          expect(body.rooms).toEqual([
            { id: den.id, type: 'Den', displayType: 'estudio', title: 'Título del estudio' },
          ])
        })
      })
    })

    describe('GET availability', () => {
      const subject = async <StatusCode extends 200 | 400 | 404>(
        place: Place,
        expectedStatus: StatusCode,
      ) => {
        return request.get('/v1/visitor/places/{id}/availability', expectedStatus, {
          id: place.id,
        })
      }

      it('returns occupied booking ranges with exclusive checkout dates', async () => {
        const place = await createPlace()
        const startsOn = CalendarDate.today().plus({ days: 2 })
        const checkoutOn = startsOn.plus({ days: 3 })
        await createBooking({ place, startsOn, endsOn: checkoutOn })
        await createBooking({ place, startsOn: checkoutOn, endsOn: checkoutOn.plus({ days: 2 }) })
        await createBooking()

        const { body } = await subject(place, 200)

        expect(body).toEqual({
          placeId: place.id,
          occupiedRanges: [
            {
              startsOn: startsOn.toISO(),
              endsOn: checkoutOn.toISO(),
            },
            {
              startsOn: checkoutOn.toISO(),
              endsOn: checkoutOn.plus({ days: 2 }).toISO(),
            },
          ],
        })
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
      const subject = async <StatusCode extends 200 | 400>(
        expectedStatus: StatusCode,
        query: { q?: string } = {},
      ) => {
        return request.get('/v1/visitor/places', expectedStatus, {
          query,
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
            favoriteId: null,
            favorited: false,
            id: place.id,
            title: 'The Spanish title',
          },
        ])
      })

      it('filters Places by search query', async () => {
        const matchingPlace = await createPlace({ name: 'Riverbend Cabin' })
        await createLocalizedText({ localizable: matchingPlace, locale: 'es-ES', title: 'The River title' })

        await createPlace({ name: 'High Branch Treehouse' })

        const { body } = await subject(200, { q: 'river' })

        expect(body.results).toEqual([
          {
            favoriteId: null,
            favorited: false,
            id: matchingPlace.id,
            title: 'The River title',
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

    describe('GET availability', () => {
      const subject = async <StatusCode extends 200 | 400 | 404>(
        place: Place,
        expectedStatus: StatusCode,
      ) => {
        return request.get('/v1/visitor/places/{id}/availability', expectedStatus, {
          id: place.id,
        })
      }

      it('returns occupied booking ranges', async () => {
        const place = await createPlace()
        const startsOn = CalendarDate.today().plus({ days: 2 })
        const endsOn = startsOn.plus({ days: 3 })
        await createBooking({ place, startsOn, endsOn })
        await createBooking()

        const { body } = await subject(place, 200)

        expect(body).toEqual({
          placeId: place.id,
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
  favoriteId = null,
}: Awaited<ReturnType<typeof createRoomsForPlace>> & { favoriteId?: string | null; place: Place }) {
  return {
    favoriteId,
    favorited: !!favoriteId,
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
