import { UpdateableProperties } from '@rvoh/dream/types'
import Booking from '@models/Booking.js'
import Guest from '@models/Guest.js'
import Place from '@models/Place.js'
import Review from '@models/Review.js'
import createBooking from '@spec/factories/BookingFactory.js'

let counter = 0

export default async function createReview(
  attrs: UpdateableProperties<Review> & { booking?: Booking; guest?: Guest; place?: Place } = {},
) {
  const booking =
    attrs.booking ??
    (await createBooking({
      ...(attrs.guest ? { guest: attrs.guest } : {}),
      ...(attrs.place ? { place: attrs.place } : {}),
    }))

  return await Review.create({
    booking,
    rating: 1,
    body: `Review body ${++counter}`,
    ...attrs,
  })
}
