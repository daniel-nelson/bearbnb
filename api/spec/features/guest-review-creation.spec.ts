import { CalendarDate } from '@rvoh/dream'
import AppEnv from '@conf/AppEnv.js'
import Booking from '@models/Booking.js'
import Review from '@models/Review.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest review creation', () => {
  const baseUrl = AppEnv.string('CLIENT_APP_HOST')

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`
  }

  it('lets a signed-in guest review immediately after booking', async () => {
    const email = uniqueEmail('review')

    // Pick check-in / checkout in next month so a single "Next month" click
    // reaches them on the calendar, regardless of the day this spec runs.
    const month = CalendarDate.today().plus({ months: 1 }).startOf('month')
    const checkIn = month.plus({ days: 9 })
    const checkout = month.plus({ days: 11 })

    const place = await createPlace()
    await (await place.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Creekside Cabin' })

    // Sign up a real guest against the Firebase emulator.
    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')
    await page.type('[name="signup-name"]', 'Creek Bear')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', 'password123')
    await page.click('[data-testid="auth-accept-terms"]')
    await page.click('[data-testid="auth-submit"]')
    await page.waitForSelector('[data-testid="header-avatar"]')

    // Navigate to the detail page within the SPA so the session persists, then
    // book a range on the month-grid calendar.
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
    await page.click(`a[href="/places/${place.id}"]`)
    await page.waitForSelector('[aria-label="Next month"]')
    await page.click('[aria-label="Next month"]')
    await page.click(`[data-testid="availability-day-${checkIn.toISO()}"]`)
    await page.click(`[data-testid="availability-day-${checkout.toISO()}"]`)
    await page.click('[data-testid="booking-submit"]')
    await page.waitForSelector('[data-testid="booking-message"]')

    // The review form appears once the booking is confirmed.
    await page.waitForSelector('[data-testid="review-submit"]')
    await page.type('[data-testid="review-rating"]', '4')
    await expect(page).toFill('[data-testid="review-body"]', 'Cozy stay with excellent creek access.')
    await page.click('[data-testid="review-submit"]')
    await page.waitForSelector('[data-testid="review-message"]')

    await expect(page).toMatchTextContent('Reviewed Creekside Cabin.')
    // The new review is prepended into the public review list.
    await expect(page).toMatchTextContent(/4 out of 5/i)
    await expect(page).toMatchTextContent('Cozy stay with excellent creek access.')

    const booking = await Booking.where({ place }).firstOrFail()
    const review = await Review.where({ booking }).firstOrFail()
    expect(review.rating).toEqual(4)
    expect(review.body).toEqual('Cozy stay with excellent creek access.')
  })

  it('lets a returning signed-in guest review a past booking', async () => {
    const email = uniqueEmail('returning-review')

    // Pick check-in / checkout in next month so a single "Next month" click
    // reaches them on the calendar, regardless of the day this spec runs.
    const month = CalendarDate.today().plus({ months: 1 }).startOf('month')
    const checkIn = month.plus({ days: 9 })
    const checkout = month.plus({ days: 11 })

    const place = await createPlace()
    await (
      await place.associationQuery('localizedTexts').firstOrFail()
    ).update({ title: 'Ridgeline Retreat' })

    // Sign up a real guest against the Firebase emulator.
    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')
    await page.type('[name="signup-name"]', 'Ridge Bear')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', 'password123')
    await page.click('[data-testid="auth-accept-terms"]')
    await page.click('[data-testid="auth-submit"]')
    await page.waitForSelector('[data-testid="header-avatar"]')

    // Navigate to the detail page within the SPA so the session persists, then
    // book a range on the month-grid calendar.
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
    await page.click(`a[href="/places/${place.id}"]`)
    await page.waitForSelector('[aria-label="Next month"]')
    await page.click('[aria-label="Next month"]')
    await page.click(`[data-testid="availability-day-${checkIn.toISO()}"]`)
    await page.click(`[data-testid="availability-day-${checkout.toISO()}"]`)
    await page.click('[data-testid="booking-submit"]')
    await page.waitForSelector('[data-testid="booking-message"]')

    // Leave the detail page back to the places index, then return — dropping the
    // immediate post-booking state so only a refetch can surface the form.
    await page.click('a[href="/"]')
    await page.waitForSelector('[data-testid="place-search"]')
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
    await page.click(`a[href="/places/${place.id}"]`)

    // Without the immediate post-booking state, the review form only appears
    // because the reviewable booking was reloaded — this proves the fix.
    await page.waitForSelector('[data-testid="review-submit"]')
    await page.type('[data-testid="review-rating"]', '5')
    await expect(page).toFill('[data-testid="review-body"]', 'Returned to write up this ridgeline gem.')
    await page.click('[data-testid="review-submit"]')
    await page.waitForSelector('[data-testid="review-message"]')

    await expect(page).toMatchTextContent('Reviewed Ridgeline Retreat.')
    // The new review is prepended into the public review list.
    await expect(page).toMatchTextContent(/5 out of 5/i)
    await expect(page).toMatchTextContent('Returned to write up this ridgeline gem.')

    const booking = await Booking.where({ place }).firstOrFail()
    const review = await Review.where({ booking }).firstOrFail()
    expect(review.rating).toEqual(5)
    expect(review.body).toEqual('Returned to write up this ridgeline gem.')
  })
})
