import AppEnv from '@conf/AppEnv.js'
import Booking from '@models/Booking.js'
import { CalendarDate } from '@rvoh/dream'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest booking', () => {
  it('books a place from the detail page after test auth sign-in', async () => {
    const place = await createPlace({ sleeps: 4 })
    const email = 'guest@example.com'
    const startsOn = CalendarDate.today().plus({ days: 12 })
    const endsOn = startsOn.plus({ days: 2 })
    await (
      await place.associationQuery('localizedTexts').firstOrFail()
    ).update({ title: 'Creekside Cottage' })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click('[data-testid="test-auth-submit"]')
    await expect(page).toMatchTextContent(email)
    await page.click(`a[href="/places/${place.id}"]`)

    await page.waitForSelector('[data-testid="booking-starts-on"]')
    await setInputValue('[data-testid="booking-starts-on"]', startsOn.toISO())
    await setInputValue('[data-testid="booking-ends-on"]', endsOn.toISO())
    await page.click('[data-testid="booking-submit"]')

    await expect(page).toMatchTextContent('Booking confirmed.')

    const booking = await Booking.where({ place }).firstOrFail()
    const guest = await booking.associationQuery('guest').firstOrFail()
    const user = await guest.associationQuery('user').firstOrFail()
    expect(booking.guestId).toEqual(guest.id)
    expect(user.email).toEqual(email)
    expect(booking.startsOn).toEqualCalendarDate(startsOn)
    expect(booking.endsOn).toEqualCalendarDate(endsOn)
  })
})

async function setInputValue(selector: string, value: string) {
  const updated = await page.evaluate(
    ({ selector, value }) => {
      const input = document.querySelector<HTMLInputElement>(selector)
      if (!input) return false
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    },
    { selector, value },
  )

  expect(updated).toBe(true)
}
