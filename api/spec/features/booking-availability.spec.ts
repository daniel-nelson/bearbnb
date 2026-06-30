import { CalendarDate } from '@rvoh/dream'
import AppEnv from '@conf/AppEnv.js'
import Booking from '@models/Booking.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('booking availability', () => {
  const baseUrl = AppEnv.string('CLIENT_APP_HOST')

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`
  }

  it('disables occupied nights while allowing same-day turnover on checkout', async () => {
    const email = uniqueEmail('availability')

    // Reserve nights in next month so the calendar reaches them with a single
    // "Next month" click, regardless of the day this spec runs.
    const month = CalendarDate.today().plus({ months: 1 }).startOf('month')
    const startsOn = month.plus({ days: 9 })
    const checkoutOn = startsOn.plus({ days: 3 })

    const place = await createPlace()
    await (await place.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Open Ridge Cabin' })
    await createBooking({ place, startsOn, endsOn: checkoutOn })

    // Sign up a real guest against the Firebase emulator (auth-gated booking UI).
    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')
    await page.type('[name="signup-name"]', 'Ridge Bear')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', 'password123')
    await page.click('[data-testid="auth-accept-terms"]')
    await page.click('[data-testid="auth-submit"]')
    await page.waitForSelector('[data-testid="header-avatar"]')

    // Navigate to the detail page within the SPA so the session persists.
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
    await page.click(`a[href="/places/${place.id}"]`)

    // Advance the month-grid calendar to the reserved month.
    await page.waitForSelector('[aria-label="Next month"]')
    await page.click('[aria-label="Next month"]')

    // Occupied nights are struck-through and disabled (checkout-exclusive ranges),
    // while the prior booking's checkout day remains bookable for same-day turnover.
    await page.waitForSelector(`[data-testid="availability-day-${startsOn.toISO()}"][disabled]`)
    await page.waitForSelector(
      `[data-testid="availability-day-${startsOn.plus({ days: 1 }).toISO()}"][disabled]`,
    )
    await page.waitForSelector(`[data-testid="availability-day-${checkoutOn.toISO()}"]:not([disabled])`)

    // Book the turnover night: check in on the prior checkout day, check out the next day.
    await page.click(`[data-testid="availability-day-${checkoutOn.toISO()}"]`)
    await page.click(`[data-testid="availability-day-${checkoutOn.plus({ days: 1 }).toISO()}"]`)
    await page.click('[data-testid="booking-submit"]')

    await page.waitForSelector('[data-testid="booking-message"]')
    await expect(page).toMatchTextContent(
      `Booked ${checkoutOn.toISO()} through ${checkoutOn.plus({ days: 1 }).toISO()}.`,
    )

    const booking = await Booking.where({ place, startsOn: checkoutOn }).firstOrFail()
    expect(booking.endsOn).toEqualCalendarDate(checkoutOn.plus({ days: 1 }))
  })
})
