import Review from '@models/Review.js'
import User from '@models/User.js'
import Guest from '@models/Guest.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Guest/ReviewsController', () => {
  let request: SpecRequestType
  let user: User
  let guest: Guest

  beforeEach(async () => {
    user = await createUser()
    guest = await user.associationQuery('guest').firstOrFail()
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/guest/reviews', expectedStatus)
    }

    it('returns the index of Reviews', async () => {
      const review = await createReview({ guest })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: review.id,
          bookingId: review.bookingId,
          rating: review.rating,
          body: review.body,
        }),
      ])
    })

    context('Reviews created by another Guest', () => {
      it('are omitted', async () => {
        await createReview()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404 | 409>(
      data: RequestBody<'post', '/v1/guest/reviews'>,
      expectedStatus: StatusCode,
    ) => {
      return request.post('/v1/guest/reviews', expectedStatus, {
        data,
      })
    }

    it('creates a Review for this Guest', async () => {
      const booking = await createBooking({ guest })

      const { body } = await create(
        {
          bookingId: booking.id,
          rating: 1,
          body: 'The Review body',
        },
        201,
      )

      const review = await guest.associationQuery('reviews').firstOrFail()
      expect(review.bookingId).toEqual(booking.id)
      expect(review.rating).toEqual(1)
      expect(review.body).toEqual('The Review body')

      expect(body).toEqual(
        expect.objectContaining({
          id: review.id,
          bookingId: booking.id,
          rating: review.rating,
          body: review.body,
        }),
      )
    })

    it('rejects another Guest Booking', async () => {
      const booking = await createBooking()

      await create(
        {
          bookingId: booking.id,
          rating: 5,
          body: 'Not my stay',
        },
        404,
      )

      expect(await Review.count()).toEqual(0)
    })

    it('rejects a second active Review for the same Booking', async () => {
      const booking = await createBooking({ guest })
      await createReview({ booking })

      await create(
        {
          bookingId: booking.id,
          rating: 5,
          body: 'Second review',
        },
        409,
      )

      expect(await booking.associationQuery('review').count()).toEqual(1)
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      review: Review,
      data: RequestBody<'patch', '/v1/guest/reviews/{id}'>,
      expectedStatus: StatusCode,
    ) => {
      return request.patch('/v1/guest/reviews/{id}', expectedStatus, {
        id: review.id,
        data,
      })
    }

    it('updates the Review', async () => {
      const review = await createReview({ guest })

      await update(
        review,
        {
          rating: 2,
          body: 'Updated Review body',
        },
        204,
      )

      await review.reload()
      expect(review.rating).toEqual(2)
      expect(review.body).toEqual('Updated Review body')
    })

    context('a Review created by another Guest', () => {
      it('is not updated', async () => {
        const review = await createReview()
        const originalRating = review.rating
        const originalBody = review.body

        await update(
          review,
          {
            rating: 2,
            body: 'Updated Review body',
          },
          404,
        )

        await review.reload()
        expect(review.rating).toEqual(originalRating)
        expect(review.body).toEqual(originalBody)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(
      review: Review,
      expectedStatus: StatusCode,
    ) => {
      return request.delete('/v1/guest/reviews/{id}', expectedStatus, {
        id: review.id,
      })
    }

    it('deletes the Review', async () => {
      const review = await createReview({ guest })

      await destroy(review, 204)

      expect(await Review.find(review.id)).toBeNull()
    })

    context('a Review created by another Guest', () => {
      it('is not deleted', async () => {
        const review = await createReview()

        await destroy(review, 404)

        expect(await Review.find(review.id)).toMatchDreamModel(review)
      })
    })
  })
})
