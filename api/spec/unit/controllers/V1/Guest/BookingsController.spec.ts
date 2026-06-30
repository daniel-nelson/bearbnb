import { CalendarDate } from '@rvoh/dream'
import Booking from '@models/Booking.js'
import Place from '@models/Place.js'
import User from '@models/User.js'
import Guest from '@models/Guest.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/Guest/BookingsController', () => {
  let request: SpecRequestType
  let user: User
  let guest: Guest

  beforeEach(async () => {
    user = await createUser()
    guest = await user.associationQuery('guest').firstOrFail()
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
          placeId: booking.placeId,
          startsOn: booking.startsOn.toISO(),
          endsOn: booking.endsOn.toISO(),
        }),
      ])
    })

    context('Bookings created by another Guest', () => {
      it('are omitted', async () => {
        await createBooking()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('POST create', () => {
    let place: Place
    let startsOn: CalendarDate
    let endsOn: CalendarDate

    beforeEach(async () => {
      place = await createPlace()
      startsOn = CalendarDate.today()
      endsOn = startsOn.plus({ days: 3 })
    })

    const create = async <StatusCode extends 201 | 400 | 404 | 409>(
      data: RequestBody<'post', '/v1/guest/bookings'>,
      expectedStatus: StatusCode,
    ) => {
      return request.post('/v1/guest/bookings', expectedStatus, {
        data,
      })
    }

    it('creates a Booking for this Guest', async () => {
      const { body } = await create(
        {
          placeId: place.id,
          startsOn: startsOn.toISO(),
          endsOn: endsOn.toISO(),
        },
        201,
      )

      const booking = await guest.associationQuery('bookings').firstOrFail()
      expect(booking.placeId).toEqual(place.id)
      expect(booking.startsOn).toEqualCalendarDate(startsOn)
      expect(booking.endsOn).toEqualCalendarDate(endsOn)

      expect(body).toEqual(
        expect.objectContaining({
          id: booking.id,
          placeId: place.id,
          startsOn: booking.startsOn.toISO(),
          endsOn: booking.endsOn.toISO(),
        }),
      )
    })

    it('rejects overlapping dates for the same Place', async () => {
      await createBooking({ place, startsOn, endsOn })

      await create(
        {
          placeId: place.id,
          startsOn: startsOn.plus({ days: 1 }).toISO(),
          endsOn: endsOn.plus({ days: 1 }).toISO(),
        },
        409,
      )

      expect(await guest.associationQuery('bookings').count()).toEqual(0)
    })

    it('allows same-day turnover on the checkout date', async () => {
      await createBooking({ place, startsOn, endsOn })

      await create(
        {
          placeId: place.id,
          startsOn: endsOn.toISO(),
          endsOn: endsOn.plus({ days: 2 }).toISO(),
        },
        201,
      )

      const booking = await guest.associationQuery('bookings').firstOrFail()
      expect(booking.startsOn).toEqualCalendarDate(endsOn)
    })

    it('allows overlapping dates for a different Place', async () => {
      await createBooking({ startsOn, endsOn })

      await create(
        {
          placeId: place.id,
          startsOn: startsOn.toISO(),
          endsOn: endsOn.toISO(),
        },
        201,
      )

      const booking = await guest.associationQuery('bookings').firstOrFail()
      expect(booking.placeId).toEqual(place.id)
    })

    it('rejects a checkout date that is not after the check-in date', async () => {
      await create(
        {
          placeId: place.id,
          startsOn: startsOn.toISO(),
          endsOn: startsOn.toISO(),
        },
        400,
      )

      expect(await guest.associationQuery('bookings').count()).toEqual(0)
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404 | 409>(
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
      const place = await createPlace()
      const booking = await createBooking({ guest })
      const startsOn = CalendarDate.today().plus({ days: 5 })
      const endsOn = startsOn.plus({ days: 2 })

      await update(
        booking,
        {
          placeId: place.id,
          startsOn: startsOn.toISO(),
          endsOn: endsOn.toISO(),
        },
        204,
      )

      await booking.reload()
      expect(booking.placeId).toEqual(place.id)
      expect(booking.startsOn).toEqualCalendarDate(startsOn)
      expect(booking.endsOn).toEqualCalendarDate(endsOn)
    })

    it('rejects updates that overlap another active Booking for the same Place', async () => {
      const place = await createPlace()
      const startsOn = CalendarDate.today()
      const endsOn = startsOn.plus({ days: 3 })
      await createBooking({ place, startsOn, endsOn })
      const booking = await createBooking({
        guest,
        place,
        startsOn: endsOn.plus({ days: 1 }),
        endsOn: endsOn.plus({ days: 3 }),
      })

      await update(
        booking,
        {
          placeId: place.id,
          startsOn: startsOn.plus({ days: 1 }).toISO(),
          endsOn: endsOn.plus({ days: 1 }).toISO(),
        },
        409,
      )

      await booking.reload()
      expect(booking.startsOn).toEqualCalendarDate(endsOn.plus({ days: 1 }))
    })

    it('allows updates that start on another Booking checkout date', async () => {
      const place = await createPlace()
      const startsOn = CalendarDate.today()
      const endsOn = startsOn.plus({ days: 3 })
      await createBooking({ place, startsOn, endsOn })
      const booking = await createBooking({
        guest,
        place,
        startsOn: endsOn.plus({ days: 2 }),
        endsOn: endsOn.plus({ days: 4 }),
      })

      await update(
        booking,
        {
          placeId: place.id,
          startsOn: endsOn.toISO(),
          endsOn: endsOn.plus({ days: 2 }).toISO(),
        },
        204,
      )

      await booking.reload()
      expect(booking.startsOn).toEqualCalendarDate(endsOn)
    })

    context('a Booking created by another Guest', () => {
      it('is not updated', async () => {
        const booking = await createBooking()
        const originalStartsOn = booking.startsOn
        const originalEndsOn = booking.endsOn

        await update(
          booking,
          {
            placeId: booking.placeId,
            startsOn: CalendarDate.today().plus({ days: 5 }).toISO(),
            endsOn: CalendarDate.today().plus({ days: 7 }).toISO(),
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

    context('a Booking created by another Guest', () => {
      it('is not deleted', async () => {
        const booking = await createBooking()

        await destroy(booking, 404)

        expect(await Booking.find(booking.id)).toMatchDreamModel(booking)
      })
    })
  })
})
