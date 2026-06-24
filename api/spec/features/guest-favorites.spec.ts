import AppEnv from '@conf/AppEnv.js'
import Favorite from '@models/Favorite.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest favorites', () => {
  const baseUrl = AppEnv.string('CLIENT_APP_HOST')

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`
  }

  it('lets a signed-in guest favorite from the index and unfavorite from detail', async () => {
    const email = uniqueEmail('favorites')
    const place = await createPlace()
    await (
      await place.associationQuery('localizedTexts').firstOrFail()
    ).update({ title: 'Fern Valley Burrow' })

    // Signed-out visitors see no favorite controls.
    await visit('/', { baseUrl })
    await expect(page).toMatchTextContent('Fern Valley Burrow')
    expect(await page.$(`[data-testid="favorite-toggle-${place.id}"]`)).toBeNull()

    // Sign up a real guest against the Firebase emulator.
    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')
    await page.type('[name="signup-name"]', 'Fern Bear')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', 'password123')
    await page.click('[data-testid="auth-accept-terms"]')
    await page.click('[data-testid="auth-submit"]')
    await page.waitForSelector('[data-testid="header-avatar"]')

    // Favorite from the index card.
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.click(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="true"]`)
    await expect(page).toMatchTextContent('Saved')

    const favorite = await Favorite.where({ place }).firstOrFail()
    const guest = await favorite.associationQuery('guest').firstOrFail()
    const user = await guest.associationQuery('user').firstOrFail()
    expect(user.email).toEqual(email)

    // The saved state is reflected on the detail page.
    await page.click(`a[href="/places/${place.id}"]`)
    await expect(page).toMatchTextContent('Fern Valley Burrow')
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="true"]`)

    // Unfavorite from detail.
    await page.click(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="false"]`)
    expect(await Favorite.find(favorite.id)).toBeNull()
  })
})
