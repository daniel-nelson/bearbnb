import AppEnv from '@conf/AppEnv.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createBedroom from '@spec/factories/Room/BedroomFactory.js'
import createKitchen from '@spec/factories/Room/KitchenFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest place detail', () => {
  it('navigates from the places index to a place detail page', async () => {
    const place = await createPlace({ style: 'cabin', sleeps: 4 })
    await (await place.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Cedar Ridge Cabin' })
    const kitchen = await createKitchen({ place })
    await (await kitchen.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Breakfast kitchen' })
    const bedroom = await createBedroom({ place })
    await (await bedroom.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Loft bedroom' })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click(`a[href="/places/${place.id}"]`)

    await expect(page).toMatchTextContent('Cedar Ridge Cabin')
    await expect(page).toMatchTextContent('cabin')
    await expect(page).toMatchTextContent('Sleeps 4')
    await expect(page).toMatchTextContent('Breakfast kitchen')
    await expect(page).toMatchTextContent('Loft bedroom')
  })
})
