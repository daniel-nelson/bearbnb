import AppEnv from '@conf/AppEnv.js'
import Place from '@models/Place.js'
import Room from '@models/Room.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createReview from '@spec/factories/ReviewFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('client place reviews', () => {
  it('shows verified-stay reviews on the public place detail page', async () => {
    const place = await createPlace({ name: 'riverbend-cabin', style: 'cabin', sleeps: 4 })
    await setPlaceTitle(place, 'Riverbend Cabin')
    await createReview({
      place,
      rating: 5,
      body: 'Quiet, clean, and close to the river.',
    })

    await visit(`/places/${place.id}`, { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await expect(page).toMatchTextContent('Riverbend Cabin')
    await expect(page).toMatchTextContent('Guest notes')
    await expect(page).toMatchTextContent('5 out of 5')
    await expect(page).toMatchTextContent('Quiet, clean, and close to the river.')
  })
})

async function setPlaceTitle(localizable: Place | Room, title: string) {
  const localizedText = await localizable
    .associationQuery('localizedTexts', { and: { locale: 'en-US' } })
    .firstOrFail()
  await localizedText.update({ title })
}
