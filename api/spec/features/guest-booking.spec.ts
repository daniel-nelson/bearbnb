import AppEnv from '@conf/AppEnv.js'
import Booking from '@models/Booking.js'
import { CalendarDate } from '@rvoh/dream'
import createBooking from '@spec/factories/BookingFactory.js'
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
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
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

  it('greys out occupied nights while allowing checkout-day turnover', async () => {
    const place = await createPlace({ sleeps: 2 })
    const existingStartsOn = CalendarDate.today().plus({ days: 8 })
    const existingEndsOn = existingStartsOn.plus({ days: 2 })
    const newEndsOn = existingEndsOn.plus({ days: 2 })
    await createBooking({
      place,
      startsOn: existingStartsOn,
      endsOn: existingEndsOn,
    })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click('[data-testid="test-auth-submit"]')
    await expect(page).toMatchTextContent('guest@example.com')
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
    await page.click(`a[href="/places/${place.id}"]`)

    await page.waitForSelector(calendarDaySelector(existingStartsOn))
    expect(await calendarDayDisabled(existingStartsOn)).toBe(true)
    expect(await calendarDayDisabled(existingStartsOn.plus({ days: 1 }))).toBe(true)
    expect(await calendarDayDisabled(existingEndsOn)).toBe(false)

    await page.click(calendarDaySelector(existingEndsOn))
    await page.click(calendarDaySelector(newEndsOn))
    await page.click('[data-testid="booking-submit"]')

    await expect(page).toMatchTextContent('Booking confirmed.')

    const booking = await Booking.where({ place, startsOn: existingEndsOn }).firstOrFail()
    expect(await Booking.where({ place }).count()).toEqual(2)
    expect(booking.startsOn).toEqualCalendarDate(existingEndsOn)
    expect(booking.endsOn).toEqualCalendarDate(newEndsOn)
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

function calendarDaySelector(day: CalendarDate) {
  return `[data-testid="calendar-day-${day.toISO()}"]`
}

async function calendarDayDisabled(day: CalendarDate) {
  return await page.$eval(calendarDaySelector(day), element => {
    return element instanceof HTMLButtonElement && element.disabled
  })
}
