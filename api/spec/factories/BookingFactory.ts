import { CalendarDate } from '@rvoh/dream'
import { UpdateableProperties } from '@rvoh/dream/types'
import Booking from '@models/Booking.js'
import createGuest from '@spec/factories/GuestFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'

export default async function createBooking(attrs: UpdateableProperties<Booking> = {}) {
  return await Booking.create({
    guest: attrs.guest ? null : await createGuest(),
    place: attrs.place ? null : await createPlace(),
    startsOn: CalendarDate.today(),
    endsOn: CalendarDate.today(),
    ...attrs,
  })
}
