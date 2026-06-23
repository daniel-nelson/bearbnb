import AppEnv from '@conf/AppEnv.js'
import Favorite from '@models/Favorite.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest favorites', () => {
  it('lets a signed-in guest favorite a place from the index', async () => {
    const place = await createPlace()
    await (
      await place.associationQuery('localizedTexts').firstOrFail()
    ).update({ title: 'Fern Valley Burrow' })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click('[data-testid="test-auth-submit"]')
    await expect(page).toMatchTextContent('guest@example.com')
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.click(`[data-testid="favorite-toggle-${place.id}"]`)
    await expect(page).toMatchTextContent('Saved')

    const favorite = await Favorite.where({ place }).firstOrFail()
    const guest = await favorite.associationQuery('guest').firstOrFail()
    const user = await guest.associationQuery('user').firstOrFail()
    expect(user.email).toEqual('guest@example.com')

    await page.click(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="false"]`)
    expect(await Favorite.find(favorite.id)).toBeNull()
  })
})
