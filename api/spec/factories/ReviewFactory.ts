import { UpdateableProperties } from '@rvoh/dream/types'
import Review from '@models/Review.js'
import createBooking from '@spec/factories/BookingFactory.js'

let counter = 0

export default async function createReview(attrs: UpdateableProperties<Review> = {}) {
  return await Review.create({
    booking: attrs.booking ? null : await createBooking(),
    rating: 5,
    body: `Review body ${++counter}`,
    ...attrs,
  })
}
