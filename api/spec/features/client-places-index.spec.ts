import AppEnv from '@conf/AppEnv.js'
import Place from '@models/Place.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('client places index', () => {
  it('renders guest-facing places from the API', async () => {
    const cottage = await createPlace({ name: 'grey-pine-cottage', style: 'cottage', sleeps: 2 })
    await setPlaceTitle(cottage, 'Grey Pine Cottage')

    const cabin = await createPlace({ name: 'riverbend-cabin', style: 'cabin', sleeps: 4 })
    await setPlaceTitle(cabin, 'Riverbend Cabin')

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await expect(page).toMatchTextContent('Available places')
    await expect(page).toMatchTextContent('Grey Pine Cottage')
    await expect(page).toMatchTextContent('Riverbend Cabin')
  })

  it('searches guest-facing places from the API', async () => {
    const cottage = await createPlace({ name: 'grey-pine-cottage', style: 'cottage', sleeps: 2 })
    await setPlaceTitle(cottage, 'Grey Pine Cottage')

    const cabin = await createPlace({ name: 'riverbend-cabin', style: 'cabin', sleeps: 4 })
    await setPlaceTitle(cabin, 'Riverbend Cabin')

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await fillIn('[name="place-search"]', 'river')
    await clickButton('Search')

    await expect(page).toMatchTextContent('Riverbend Cabin')
    await expect(page).not.toMatchTextContent('Grey Pine Cottage')
  })
})

async function setPlaceTitle(place: Place, title: string) {
  const localizedText = await place
    .associationQuery('localizedTexts', { and: { locale: 'en-US' } })
    .firstOrFail()
  await localizedText.update({ title })
}
