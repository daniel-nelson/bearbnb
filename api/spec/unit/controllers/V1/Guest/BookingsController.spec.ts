import { CalendarDate } from '@rvoh/dream'
import Booking from '@models/Booking.js'
import Guest from '@models/Guest.js'
import Place from '@models/Place.js'
import User from '@models/User.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Guest/BookingsController', () => {
  let request: SpecRequestType
  let guest: Guest
  let place: Place
  let user: User

  beforeEach(async () => {
    user = await createUser()
    guest = await user.associationQuery('guest').firstOrFail()
    place = await createPlace()
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/guest/bookings', expectedStatus)
    }

    it('returns the index of Bookings', async () => {
      const booking = await createBooking({ guest })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: booking.id,
        }),
      ])
    })

    context('Bookings created by another User', () => {
      it('are omitted', async () => {
        await createBooking()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(booking: Booking, expectedStatus: StatusCode) => {
      return request.get('/v1/guest/bookings/{id}', expectedStatus, {
        id: booking.id,
      })
    }

    it('returns the specified Booking', async () => {
      const booking = await createBooking({ guest })

      const { body } = await show(booking, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: booking.id,
          placeId: booking.placeId,
          startsOn: booking.startsOn.toISO(),
          endsOn: booking.endsOn.toISO(),
        }),
      )
    })

    context('Booking created by another User', () => {
      it('is not found', async () => {
        const otherUserBooking = await createBooking()

        await show(otherUserBooking, 404)
      })
    })
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

    it('creates a Booking for this User', async () => {
      const today = CalendarDate.today()

      const { body } = await create(
        {
          placeId: place.id,
          startsOn: today.toISO(),
          endsOn: today.toISO(),
        },
        201,
      )

      const booking = await guest.associationQuery('bookings').firstOrFail()
      expect(booking.placeId).toEqual(place.id)
      expect(booking.startsOn).toEqualCalendarDate(today)
      expect(booking.endsOn).toEqualCalendarDate(today)

      expect(body).toEqual(
        expect.objectContaining({
          id: booking.id,
          placeId: booking.placeId,
          startsOn: booking.startsOn.toISO(),
          endsOn: booking.endsOn.toISO(),
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      booking: Booking,
      data: RequestBody<'patch', '/v1/guest/bookings/{id}'>,
      expectedStatus: StatusCode,
    ) => {
      return request.patch('/v1/guest/bookings/{id}', expectedStatus, {
        id: booking.id,
        data,
      })
    }

    it('updates the Booking', async () => {
      const yesterday = CalendarDate.yesterday()

      const booking = await createBooking({ guest })

      await update(
        booking,
        {
          startsOn: yesterday.toISO(),
          endsOn: yesterday.toISO(),
        },
        204,
      )

      await booking.reload()
      expect(booking.startsOn).toEqualCalendarDate(yesterday)
      expect(booking.endsOn).toEqualCalendarDate(yesterday)
    })

    context('a Booking created by another User', () => {
      it('is not updated', async () => {
        const yesterday = CalendarDate.yesterday()

        const booking = await createBooking()
        const originalStartsOn = booking.startsOn
        const originalEndsOn = booking.endsOn

        await update(
          booking,
          {
            startsOn: yesterday.toISO(),
            endsOn: yesterday.toISO(),
          },
          404,
        )

        await booking.reload()
        expect(booking.startsOn).toEqual(originalStartsOn)
        expect(booking.endsOn).toEqual(originalEndsOn)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(
      booking: Booking,
      expectedStatus: StatusCode,
    ) => {
      return request.delete('/v1/guest/bookings/{id}', expectedStatus, {
        id: booking.id,
      })
    }

    it('deletes the Booking', async () => {
      const booking = await createBooking({ guest })

      await destroy(booking, 204)

      expect(await Booking.find(booking.id)).toBeNull()
    })

    context('a Booking created by another User', () => {
      it('is not deleted', async () => {
        const booking = await createBooking()

        await destroy(booking, 404)

        expect(await Booking.find(booking.id)).toMatchDreamModel(booking)
      })
    })
  })
})
