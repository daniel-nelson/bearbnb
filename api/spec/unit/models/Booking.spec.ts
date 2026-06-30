import { CalendarDate } from '@rvoh/dream'
import Booking from '@models/Booking.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'

describe('Booking', () => {
  it('belongs to a Guest and Place', async () => {
    const guest = await (await createUser()).associationQuery('guest').firstOrFail()
    const place = await createPlace()

    const booking = await createBooking({ guest, place })

    expect(await booking.associationQuery('guest').first()).toMatchDreamModel(guest)
    expect(await booking.associationQuery('place').first()).toMatchDreamModel(place)
  })

  it('requires the checkout date to be after the check-in date', () => {
    const startsOn = CalendarDate.today()
    const booking = Booking.new({
      startsOn,
      endsOn: startsOn,
    })

    expect(booking.isInvalid).toBe(true)
    expect(booking.errors.endsOn ?? booking.errors.ends_on).toEqual(['must be after startsOn'])
  })

  it('rejects overlapping active Bookings for the same Place', async () => {
    const place = await createPlace()
    const startsOn = CalendarDate.today()
    const endsOn = startsOn.plus({ days: 3 })

    await createBooking({ place, startsOn, endsOn })

    await expect(createBooking({ place, startsOn: startsOn.plus({ days: 1 }), endsOn })).rejects.toThrow()
  })

  it('allows same-day turnover on the checkout date', async () => {
    const place = await createPlace()
    const startsOn = CalendarDate.today()
    const checkoutOn = startsOn.plus({ days: 3 })

    await createBooking({ place, startsOn, endsOn: checkoutOn })

    await expect(
      createBooking({ place, startsOn: checkoutOn, endsOn: checkoutOn.plus({ days: 2 }) }),
    ).resolves.toBeInstanceOf(Booking)
  })

  it('allows overlapping Bookings for different Places', async () => {
    const startsOn = CalendarDate.today()
    const endsOn = startsOn.plus({ days: 3 })

    await createBooking({ startsOn, endsOn })

    await expect(createBooking({ startsOn, endsOn })).resolves.toBeInstanceOf(Booking)
  })

  it('allows a Place to be booked again after destroying the active Booking', async () => {
    const place = await createPlace()
    const startsOn = CalendarDate.today()
    const endsOn = startsOn.plus({ days: 3 })
    const booking = await createBooking({ place, startsOn, endsOn })
    await booking.destroy()

    await expect(createBooking({ place, startsOn, endsOn })).resolves.toBeInstanceOf(Booking)
  })
})
