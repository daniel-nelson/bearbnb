import { CalendarDate } from '@rvoh/dream'
import { UpdateableProperties } from '@rvoh/dream/types'
import Booking from '@models/Booking.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'

export default async function createBooking(attrs: UpdateableProperties<Booking> = {}) {
  return await Booking.create({
    guest: attrs.guest ? null : await (await createUser()).associationQuery('guest').firstOrFail(),
    place: attrs.place ? null : await createPlace(),
    startsOn: CalendarDate.today(),
    endsOn: CalendarDate.tomorrow(),
    ...attrs,
  })
}
