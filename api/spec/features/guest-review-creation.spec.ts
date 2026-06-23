import AppEnv from '@conf/AppEnv.js'
import Review from '@models/Review.js'
import { CalendarDate } from '@rvoh/dream'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest review creation', () => {
  it('lets a guest review immediately after booking', async () => {
    const place = await createPlace({ sleeps: 2 })
    const startsOn = CalendarDate.today().plus({ days: 16 })
    const endsOn = startsOn.plus({ days: 2 })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click('[data-testid="test-auth-submit"]')
    await expect(page).toMatchTextContent('guest@example.com')
    await page.waitForSelector(`a[href="/places/${place.id}"]`)
    await page.click(`a[href="/places/${place.id}"]`)

    await page.waitForSelector('[data-testid="booking-starts-on"]')
    await setInputValue('[data-testid="booking-starts-on"]', startsOn.toISO())
    await setInputValue('[data-testid="booking-ends-on"]', endsOn.toISO())
    await page.click('[data-testid="booking-submit"]')
    await expect(page).toMatchTextContent('Booking confirmed.')

    await page.select('[data-testid="review-rating"]', '5')
    await page.type('[data-testid="review-body"]', 'Immediate review, because this den is ready.')
    await page.click('[data-testid="review-submit"]')

    await expect(page).toMatchTextContent('Review posted.')
    await expect(page).toMatchTextContent('Immediate review, because this den is ready.')

    const review = await Review.firstOrFail()
    const booking = await review.associationQuery('booking').firstOrFail()
    const guest = await booking.associationQuery('guest').firstOrFail()
    const user = await guest.associationQuery('user').firstOrFail()
    expect(user.email).toEqual('guest@example.com')
    expect(review.rating).toEqual(5)
    expect(review.body).toEqual('Immediate review, because this den is ready.')
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
