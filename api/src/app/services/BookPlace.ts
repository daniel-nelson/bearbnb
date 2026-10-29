import Booking from '#models/Booking.js'
import Guest from '#models/Guest.js'
import Place from '#models/Place.js'
import { CalendarDate } from '@rvoh/dream'

const overlapConstraintName = 'bookings_no_overlapping_active_dates'

export class BookingDatesUnavailable extends Error {}

type BookingDates = { startsOn: CalendarDate; endsOn: CalendarDate }

export default class BookPlace {
  public static async create(guest: Guest, place: Place, dates: BookingDates) {
    try {
      return await guest.createAssociation('bookings', { place, ...dates })
    } catch (err) {
      if (this.bookingOverlapError(err)) throw new BookingDatesUnavailable()
      throw err
    }
  }

  public static async update(booking: Booking, place: Place, dates: BookingDates) {
    try {
      await booking.update({ place, ...dates })
    } catch (err) {
      if (this.bookingOverlapError(err)) throw new BookingDatesUnavailable()
      throw err
    }
  }

  private static bookingOverlapError(err: unknown) {
    return (
      this.postgresError(err)?.code === '23P01' &&
      this.postgresError(err)?.constraint === overlapConstraintName
    )
  }

  private static postgresError(err: unknown): { code?: string; constraint?: string } | null {
    if (!err || typeof err !== 'object') return null

    const error = err as { code?: string; constraint?: string; cause?: unknown }
    if (error.code || error.constraint) return error

    return this.postgresError(error.cause)
  }
}
