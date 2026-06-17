import AppEnv from '@conf/AppEnv.js'
import Place from '@models/Place.js'
import Room from '@models/Room.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createBathroom from '@spec/factories/Room/BathroomFactory.js'
import createBedroom from '@spec/factories/Room/BedroomFactory.js'
import createKitchen from '@spec/factories/Room/KitchenFactory.js'
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

  it('opens a guest-facing place detail page', async () => {
    const place = await createPlace({ name: 'riverbend-cabin', style: 'cabin', sleeps: 4 })
    await setPlaceTitle(place, 'Riverbend Cabin')

    const kitchen = await createKitchen({ place, appliances: ['oven', 'dishwasher'] })
    await setPlaceTitle(kitchen, 'Kitchen')

    const bedroom = await createBedroom({ place, bedTypes: ['cot', 'bunk'] })
    await setPlaceTitle(bedroom, 'Bedroom')

    const bathroom = await createBathroom({ place, bathOrShowerStyle: 'shower' })
    await setPlaceTitle(bathroom, 'Bathroom')

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await expect(page).toMatchTextContent('Riverbend Cabin')
    await page.$$eval('a', links => {
      const link = links.find(link => link.textContent?.includes('Riverbend Cabin'))
      if (!link) throw new Error('Riverbend Cabin link was not rendered')
      link.click()
    })

    await expect(page).toMatchTextContent('Riverbend Cabin')
    await expect(page).toMatchTextContent('cabin')
    await expect(page).toMatchTextContent('Kitchen')
    await expect(page).toMatchTextContent('oven')
    await expect(page).toMatchTextContent('Bedroom')
    await expect(page).toMatchTextContent('cot')
    await expect(page).toMatchTextContent('Bathroom')
    await expect(page).toMatchTextContent('shower')
  })
})

async function setPlaceTitle(localizable: Place | Room, title: string) {
  const localizedText = await localizable
    .associationQuery('localizedTexts', { and: { locale: 'en-US' } })
    .firstOrFail()
  await localizedText.update({ title })
}
