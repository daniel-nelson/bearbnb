import Booking from '@models/Booking.js'
import { CalendarDate } from '@rvoh/dream'
import createBooking from '@spec/factories/BookingFactory.js'
import createGuest from '@spec/factories/GuestFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'

describe('Booking', () => {
  it('belongs to Guest', async () => {
    const guest = await createGuest()
    const booking = await createBooking({ guest })

    expect(await booking.associationQuery('guest').first()).toMatchDreamModel(guest)
  })

  it('belongs to Place', async () => {
    const place = await createPlace()
    const booking = await createBooking({ place })

    expect(await booking.associationQuery('place').first()).toMatchDreamModel(place)
  })

  it('requires checkout to be after check-in', async () => {
    const startsOn = CalendarDate.fromISO('2026-07-03')
    const booking = Booking.new({
      guest: await createGuest(),
      place: await createPlace(),
      startsOn,
      endsOn: startsOn,
    })

    expect(booking.isInvalid).toBe(true)
    expect(booking.errors.endsOn).toContain('must be after startsOn')
  })

  it('prevents overlapping Bookings for the same Place', async () => {
    const place = await createPlace()
    await createBooking({
      place,
      startsOn: CalendarDate.fromISO('2026-07-01'),
      endsOn: CalendarDate.fromISO('2026-07-03'),
    })

    await expect(
      createBooking({
        place,
        startsOn: CalendarDate.fromISO('2026-07-02'),
        endsOn: CalendarDate.fromISO('2026-07-04'),
      }),
    ).rejects.toThrow()
  })

  it('allows a Booking to start on another Booking checkout date', async () => {
    const place = await createPlace()
    await createBooking({
      place,
      startsOn: CalendarDate.fromISO('2026-07-01'),
      endsOn: CalendarDate.fromISO('2026-07-03'),
    })

    await createBooking({
      place,
      startsOn: CalendarDate.fromISO('2026-07-03'),
      endsOn: CalendarDate.fromISO('2026-07-05'),
    })

    expect(await Booking.where({ place }).count()).toEqual(2)
  })

  it('allows overlapping Bookings for different Places', async () => {
    const startsOn = CalendarDate.fromISO('2026-07-01')
    await createBooking({ startsOn, endsOn: startsOn.plus({ days: 2 }) })
    await createBooking({ startsOn, endsOn: startsOn.plus({ days: 2 }) })

    expect(await Booking.count()).toEqual(2)
  })
})
