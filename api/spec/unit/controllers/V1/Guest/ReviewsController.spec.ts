import Review from '@models/Review.js'
import User from '@models/User.js'
import Guest from '@models/Guest.js'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import createBooking from '@spec/factories/BookingFactory.js'
import createGuest from '@spec/factories/GuestFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'
import { paths as OpenapiPaths } from '@src/types/openapi/tests.openapi.js'

describe('V1/Guest/ReviewsController', () => {
  let request: SpecRequestType
  let user: User
  let guest: Guest

  beforeEach(async () => {
    user = await createUser()
    guest = await createGuest({ user })
    request = await session(user)
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 401 | 404>(
      data: RequestBody<'post', '/v1/guest/reviews'>,
      expectedStatus: StatusCode,
    ) => {
      return request.post('/v1/guest/reviews', expectedStatus, { data })
    }

    it('creates a Review for a Booking owned by this Guest', async () => {
      const booking = await createBooking({ guest })

      const { body } = await create(
        {
          bookingId: booking.id,
          rating: 5,
          body: 'A clean den with excellent berry access.',
        },
        201,
      )

      const review = await booking.associationQuery('review').firstOrFail()
      expect(review.rating).toEqual(5)
      expect(review.body).toEqual('A clean den with excellent berry access.')
      expect(body).toEqual({
        id: review.id,
        rating: 5,
        body: 'A clean den with excellent berry access.',
      })
    })

    it("rejects reviewing another Guest's Booking", async () => {
      const booking = await createBooking()

      await create(
        {
          bookingId: booking.id,
          rating: 5,
          body: 'This should not be accepted.',
        },
        404,
      )

      expect(await Review.where({ booking }).exists()).toBe(false)
    })

    it('rejects a second Review for the same Booking', async () => {
      const booking = await createBooking({ guest })
      await createReview({ booking })

      await create(
        {
          bookingId: booking.id,
          rating: 4,
          body: 'Still good.',
        },
        400,
      )

      expect(await Review.where({ booking }).count()).toEqual(1)
    })

    it('rejects unauthenticated requests', async () => {
      const booking = await createBooking({ guest })
      request = new OpenapiSpecRequest<OpenapiPaths>()
      await request.init(PsychicServer)

      await create(
        {
          bookingId: booking.id,
          rating: 5,
          body: 'No bearer token.',
        },
        401,
      )
    })
  })
})
