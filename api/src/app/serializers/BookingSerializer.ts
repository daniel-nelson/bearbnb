import { DreamSerializer } from '@rvoh/dream'
import Booking from '@models/Booking.js'

export const BookingSummarySerializer = (booking: Booking) =>
  DreamSerializer(Booking, booking)
    .attribute('id')

export const BookingSerializer = (booking: Booking) =>
  BookingSummarySerializer(booking)
    .attribute('startsOn')
    .attribute('endsOn')
