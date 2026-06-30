import Review from '@models/Review.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'

describe('Review', () => {
  it('belongs to a Booking', async () => {
    const booking = await createBooking()

    const review = await createReview({ booking })

    expect(await review.associationQuery('booking').first()).toMatchDreamModel(booking)
  })

  it('requires a rating from one to five', () => {
    const review = Review.new({ rating: 6, body: 'A clear review body' })

    expect(review.isInvalid).toBe(true)
    expect(review.errors.rating).toBeDefined()
  })

  it('requires body', () => {
    const review = Review.new({ rating: 5, body: '' })

    expect(review.isInvalid).toBe(true)
    expect(review.errors.body).toBeDefined()
  })

  it('allows one active Review per Booking', async () => {
    const booking = await createBooking()
    await createReview({ booking })

    await expect(createReview({ booking })).rejects.toThrow()
  })

  it('allows a Booking to be reviewed again after destroying the active Review', async () => {
    const booking = await createBooking()
    const review = await createReview({ booking })
    await review.destroy()

    await expect(createReview({ booking })).resolves.toBeInstanceOf(Review)
  })
})
