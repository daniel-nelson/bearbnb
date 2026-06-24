import AppEnv from '@conf/AppEnv.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('visitor reviews', () => {
  it('renders public reviews on the place detail page', async () => {
    const place = await createPlace({ sleeps: 4, style: 'cabin' })
    await (await place.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Mossy Hollow Den' })
    await createReview({
      booking: await createBooking({ place }),
      rating: 5,
      body: 'Quiet den, excellent moss selection.',
    })

    await visit(`/places/${place.id}`, { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await expect(page).toMatchTextContent('Mossy Hollow Den')
    await expect(page).toMatchTextContent('Guest notes')
    await expect(page).toMatchTextContent(/5 out of 5/i)
    await expect(page).toMatchTextContent('Quiet den, excellent moss selection.')
  })
})
