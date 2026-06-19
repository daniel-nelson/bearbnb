import Review from '@models/Review.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'

describe('Review', () => {
  it('validates rating is between one and five', async () => {
    await expect(createReview({ rating: 0 })).rejects.toThrow('must be between 1 and 5')
    await expect(createReview({ rating: 6 })).rejects.toThrow('must be between 1 and 5')
  })

  it('validates body is present', async () => {
    await expect(createReview({ body: '   ' })).rejects.toThrow('must be present')
  })

  it('allows one active Review per Booking', async () => {
    const booking = await createBooking()
    await createReview({ booking })

    await expect(Review.create({ booking, rating: 5, body: 'Still worth it.' })).rejects.toThrow(
      'reviews_booking_id_unique',
    )
    expect(await Review.where({ booking }).count()).toEqual(1)
  })
})
