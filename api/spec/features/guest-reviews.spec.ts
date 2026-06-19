import AppEnv from '@conf/AppEnv.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest reviews', () => {
  it('renders public reviews on the place detail page', async () => {
    const place = await createPlace({ sleeps: 3 })
    const booking = await createBooking({ place })
    await createReview({ booking, rating: 5, body: 'Dry cave, soft moss, excellent salmon.' })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click(`a[href="/places/${place.id}"]`)

    await expect(page).toMatchTextContent('Guest reviews')
    await expect(page).toMatchTextContent('5/5')
    await expect(page).toMatchTextContent('Dry cave, soft moss, excellent salmon.')
  })
})
