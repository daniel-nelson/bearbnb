import Guest from '@models/Guest.js'
import Place from '@models/Place.js'
import { CalendarDate } from '@rvoh/dream'
import BookingDatesUnavailable from '../errors/BookingDatesUnavailable.js'

export default class BookPlace {
  public static async create({
    guest,
    place,
    startsOn,
    endsOn,
  }: {
    guest: Guest
    place: Place
    startsOn: CalendarDate
    endsOn: CalendarDate
  }) {
    try {
      return await guest.createAssociation('bookings', { place, startsOn, endsOn })
    } catch (err) {
      if (this.overlappingOccupiedNights(err)) throw new BookingDatesUnavailable()
      throw err
    }
  }

  private static overlappingOccupiedNights(err: unknown) {
    if (!err || typeof err !== 'object') return false
    return (err as { constraint?: string }).constraint === 'bookings_no_overlapping_occupied_nights'
  }
}
