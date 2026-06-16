import { UpdateableProperties } from '@rvoh/dream/types'
import Guest from '@models/Guest.js'
import Place from '@models/Place.js'
import Review from '@models/Review.js'
import createBooking from '@spec/factories/BookingFactory.js'

let counter = 0

export default async function createReview(attrs: UpdateableProperties<Review> = {}) {
  const { booking, guest, place, ...reviewAttrs } = attrs
  const reviewBooking =
    booking ||
    (await createBooking({
      ...(guest ? { guest } : {}),
      ...(place ? { place } : {}),
    }))
  const reviewGuest = guest || (await Guest.findOrFail(reviewBooking.guestId))
  const reviewPlace = place || (await Place.findOrFail(reviewBooking.placeId))

  return await Review.create({
    guest: reviewGuest,
    booking: reviewBooking,
    place: reviewPlace,
    rating: 1,
    body: `Review body ${++counter}`,
    ...reviewAttrs,
  })
}
