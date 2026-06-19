import Place from '@models/Place.js'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import createBooking from '@spec/factories/BookingFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { SpecRequestType } from '@spec/unit/helpers/authentication.js'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('V1/Guest/Places/ReviewsController', () => {
  let request: SpecRequestType
  let place: Place

  beforeEach(async () => {
    request = new OpenapiSpecRequest<OpenapiPaths>()
    await request.init(PsychicServer)
    place = await createPlace()
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/guest/places/{placeId}/reviews', expectedStatus, {
        placeId: place.id,
      })
    }

    it('returns the index of Reviews newest first', async () => {
      const booking = await createBooking({ place })
      const review = await createReview({ booking, rating: 4, body: 'The den was quiet and warm.' })
      const laterBooking = await createBooking({
        place,
        startsOn: booking.endsOn,
        endsOn: booking.endsOn.plus({ days: 1 }),
      })
      const laterReview = await createReview({
        booking: laterBooking,
        rating: 5,
        body: 'Even better the second time.',
      })

      const { body } = await index(200)

      expect(body.results).toEqual([
        {
          body: 'Even better the second time.',
          id: laterReview.id,
          rating: 5,
        },
        {
          body: 'The den was quiet and warm.',
          id: review.id,
          rating: 4,
        },
      ])
    })

    context('Reviews created by another Place', () => {
      it('are omitted', async () => {
        await createReview()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })
})
