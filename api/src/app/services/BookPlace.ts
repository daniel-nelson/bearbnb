import Booking from '@models/Booking.js'
import Guest from '@models/Guest.js'
import Place from '@models/Place.js'
import { UpdateableProperties } from '@rvoh/dream/types'

const overlapConstraintName = 'bookings_no_overlapping_active_dates'

export class BookingDatesUnavailable extends Error {}

export default class BookPlace {
  public static async create(
    guest: Guest,
    attrs: Pick<UpdateableProperties<Booking>, 'placeId' | 'startsOn' | 'endsOn'>,
  ) {
    const place = await Place.findOrFail(attrs.placeId)

    try {
      return await guest.createAssociation('bookings', {
        place,
        startsOn: attrs.startsOn,
        endsOn: attrs.endsOn,
      })
    } catch (err) {
      if (this.bookingOverlapError(err)) throw new BookingDatesUnavailable()
      throw err
    }
  }

  public static async update(
    booking: Booking,
    attrs: Pick<UpdateableProperties<Booking>, 'placeId' | 'startsOn' | 'endsOn'>,
  ) {
    await Place.findOrFail(attrs.placeId)

    try {
      await booking.update(attrs)
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
