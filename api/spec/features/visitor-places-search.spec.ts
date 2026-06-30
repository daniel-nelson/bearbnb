import AppEnv from '@conf/AppEnv.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('visitor places search', () => {
  it('filters places through the search form', async () => {
    const matchingPlace = await createPlace({ name: 'Riverbend Cabin' })
    await (
      await matchingPlace.associationQuery('localizedTexts').firstOrFail()
    ).update({
      title: 'Riverbend Cabin',
    })

    const nonMatchingPlace = await createPlace({ name: 'High Branch Treehouse' })
    await (
      await nonMatchingPlace.associationQuery('localizedTexts').firstOrFail()
    ).update({
      title: 'High Branch Treehouse',
    })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click('[data-testid="place-search"]', { clickCount: 3 })
    await page.type('[data-testid="place-search"]', 'river')
    await page.click('[data-testid="place-search-submit"]')

    await expect(page).toMatchTextContent('Riverbend Cabin')
    await expect(page).not.toMatchTextContent('High Branch Treehouse')
  })
})
