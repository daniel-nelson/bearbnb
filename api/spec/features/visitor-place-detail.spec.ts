import AppEnv from '@conf/AppEnv.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createBedroom from '@spec/factories/Room/BedroomFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('visitor place detail', () => {
  it('opens place detail from the visitor index', async () => {
    const place = await createPlace({ sleeps: 4, style: 'cabin' })
    await (await place.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Mossy Hollow Den' })

    const bedroom = await createBedroom({ place })
    await (await bedroom.associationQuery('localizedTexts').firstOrFail()).update({ title: 'Loft bedroom' })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click('a[href^="/places/"]')

    await expect(page).toMatchTextContent('Mossy Hollow Den')
    await expect(page).toMatchTextContent('Loft bedroom')
    await expect(page).toMatchTextContent('Sleeps 4')
  })
})
