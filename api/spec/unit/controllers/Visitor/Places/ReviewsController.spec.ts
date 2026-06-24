import { CalendarDate } from '@rvoh/dream'
import Place from '@models/Place.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '@rvoh/psychic'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('Visitor/Places/ReviewsController', () => {
  let request: OpenapiSpecRequest<OpenapiPaths>

  beforeEach(async () => {
    request = new OpenapiSpecRequest<OpenapiPaths>()
    await request.init(PsychicServer)
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(place: Place, expectedStatus: StatusCode) => {
      return request.get('/v1/visitor/places/{placeId}/reviews', expectedStatus, {
        placeId: place.id,
      })
    }

    it('returns Reviews for the Place newest first', async () => {
      const place = await createPlace()
      const startsOn = CalendarDate.today()
      const olderReview = await createReview({
        booking: await createBooking({ place, startsOn, endsOn: startsOn.plus({ days: 2 }) }),
        rating: 4,
        body: 'Older public review',
      })
      const newerReview = await createReview({
        booking: await createBooking({
          place,
          startsOn: startsOn.plus({ days: 3 }),
          endsOn: startsOn.plus({ days: 5 }),
        }),
        rating: 5,
        body: 'Newer public review',
      })

      const { body } = await subject(place, 200)

      expect(body.results).toEqual([
        {
          id: newerReview.id,
          rating: 5,
          body: 'Newer public review',
          createdAt: newerReview.createdAt.toISO(),
        },
        {
          id: olderReview.id,
          rating: 4,
          body: 'Older public review',
          createdAt: olderReview.createdAt.toISO(),
        },
      ])
    })

    it('omits Reviews for another Place', async () => {
      const place = await createPlace()
      await createReview({ body: 'Another place review' })

      const { body } = await subject(place, 200)

      expect(body.results).toEqual([])
    })
  })
})
