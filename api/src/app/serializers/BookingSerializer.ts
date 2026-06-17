import { DreamSerializer } from '@rvoh/dream'
import Booking from '@models/Booking.js'

export const BookingSummarySerializer = (booking: Booking) =>
  DreamSerializer(Booking, booking).attribute('id').attribute('placeId')

export const BookingSerializer = (booking: Booking) =>
  BookingSummarySerializer(booking).attribute('startsOn').attribute('endsOn')

export const BookingBookedRangeSerializer = (booking: Booking) =>
  DreamSerializer(Booking, booking).attribute('startsOn').attribute('endsOn')
