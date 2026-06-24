import { DreamSerializer } from '@rvoh/dream'
import Booking from '@models/Booking.js'

export const BookingSummarySerializer = (booking: Booking) =>
  DreamSerializer(Booking, booking)
    .attribute('id')
    .attribute('placeId')
    .attribute('startsOn')
    .attribute('endsOn')

export const BookingSerializer = (booking: Booking) =>
  BookingSummarySerializer(booking)
