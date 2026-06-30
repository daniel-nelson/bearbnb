import AppEnv from '@conf/AppEnv.js'
import Booking from '@models/Booking.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest booking', () => {
  const baseUrl = AppEnv.string('CLIENT_APP_HOST')

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`
  }

  it('lets a signed-in guest book from the place detail page', async () => {
    const email = uniqueEmail('booking')
    const place = await createPlace()
    await (
      await place.associationQuery('localizedTexts').firstOrFail()
    ).update({ title: 'Creekside Cabin' })

    // Signed-out visitors are prompted to sign in rather than shown the form.
    await visit(`/places/${place.id}`, { baseUrl })
    await expect(page).toMatchTextContent('Creekside Cabin')
    await expect(page).toMatchTextContent('to request these dates')
    expect(await page.$('[data-testid="booking-submit"]')).toBeNull()

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
    // book using the default check-in / checkout dates.
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
    await page.click(`a[href="/places/${place.id}"]`)
    await page.waitForSelector('[data-testid="booking-submit"]')
    await page.click('[data-testid="booking-submit"]')

    await page.waitForSelector('[data-testid="booking-message"]')
    await expect(page).toMatchTextContent('Booked')

    const booking = await Booking.where({ place }).firstOrFail()
    const guest = await booking.associationQuery('guest').firstOrFail()
    const user = await guest.associationQuery('user').firstOrFail()
    expect(user.email).toEqual(email)
  })
})
