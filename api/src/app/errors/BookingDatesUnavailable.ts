export default class BookingDatesUnavailable extends Error {
  public constructor() {
    super('Booking dates are unavailable')
  }
}
