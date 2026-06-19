import { CalendarDate } from '@rvoh/dream'
import Booking from '@models/Booking.js'
import User from '@models/User.js'
import Guest from '@models/Guest.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import createGuest from '@spec/factories/GuestFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Guest/BookingsController', () => {
  let request: SpecRequestType
  let user: User
  let guest: Guest

  beforeEach(async () => {
    user = await createUser()
    guest = await createGuest({ user })
    request = await session(user)
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/guest/bookings'>,
      expectedStatus: StatusCode,
    ) => {
      return request.post('/v1/guest/bookings', expectedStatus, {
        data,
      })
    }

    it('creates a Booking for this Guest', async () => {
      const today = CalendarDate.today()
      const tomorrow = today.plus({ days: 1 })
      const place = await createPlace()

      const { body } = await create(
        {
          placeId: place.id,
          startsOn: today.toISO(),
          endsOn: tomorrow.toISO(),
        },
        201,
      )

      const booking = await guest.associationQuery('bookings').firstOrFail()
      expect(booking.placeId).toEqual(place.id)
      expect(booking.startsOn).toEqualCalendarDate(today)
      expect(booking.endsOn).toEqualCalendarDate(tomorrow)

      expect(body).toEqual(
        expect.objectContaining({
          id: booking.id,
          startsOn: booking.startsOn.toISO(),
          endsOn: booking.endsOn.toISO(),
        }),
      )
    })

    it('rejects overlapping bookings for the same Place', async () => {
      const place = await createPlace()
      await createBooking({
        place,
        startsOn: CalendarDate.fromISO('2026-07-01'),
        endsOn: CalendarDate.fromISO('2026-07-03'),
      })

      await create(
        {
          placeId: place.id,
          startsOn: '2026-07-02',
          endsOn: '2026-07-04',
        },
        400,
      )

      expect(await Booking.where({ place }).count()).toEqual(1)
    })

    it('allows a booking to start on another Booking checkout date', async () => {
      const place = await createPlace()
      await createBooking({
        place,
        startsOn: CalendarDate.fromISO('2026-07-01'),
        endsOn: CalendarDate.fromISO('2026-07-03'),
      })

      await create(
        {
          placeId: place.id,
          startsOn: '2026-07-03',
          endsOn: '2026-07-05',
        },
        201,
      )

      expect(await Booking.where({ place }).count()).toEqual(2)
    })

    it('rejects a checkout date that is not after the start date', async () => {
      const place = await createPlace()

      await create(
        {
          placeId: place.id,
          startsOn: '2026-07-03',
          endsOn: '2026-07-03',
        },
        400,
      )

      expect(await Booking.where({ place }).exists()).toBe(false)
    })
  })
})
