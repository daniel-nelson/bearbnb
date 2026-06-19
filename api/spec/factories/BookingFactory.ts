import { CalendarDate } from '@rvoh/dream'
import { UpdateableProperties } from '@rvoh/dream/types'
import Booking from '@models/Booking.js'
import createGuest from '@spec/factories/GuestFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'

export default async function createBooking(attrs: UpdateableProperties<Booking> = {}) {
  const startsOn = CalendarDate.today()

  return await Booking.create({
    guest: attrs.guest ? null : await createGuest(),
    place: attrs.place ? null : await createPlace(),
    startsOn,
    endsOn: startsOn.plus({ days: 1 }),
    ...attrs,
  })
}
