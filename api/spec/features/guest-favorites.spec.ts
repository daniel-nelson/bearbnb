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

  // Signs the guest in without a route change, so the index/detail page stays
  // mounted across the auth transition. This reproduces the real bug: a page
  // that fetched its data before the bearer was available must refetch once the
  // guest signs in, or auth-derived fields (favorited) stay stale.
  async function signInOnCurrentPage(email: string, password: string) {
    await page.evaluate(
      async (e: string, p: string) => {
        await (
          window as unknown as {
            __testSignIn: (email: string, password: string) => Promise<unknown>
          }
        ).__testSignIn(e, p)
      },
      email,
      password,
    )
  }

  async function signUpAndFavorite(email: string, password: string, title: string) {
    const place = await createPlace()
    await (await place.associationQuery('localizedTexts').firstOrFail()).update({ title })

    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')
    await page.type('[name="signup-name"]', 'Fern Bear')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', password)
    await page.click('[data-testid="auth-accept-terms"]')
    await page.click('[data-testid="auth-submit"]')
    await page.waitForSelector('[data-testid="header-avatar"]')

    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.click(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="true"]`)
    await Favorite.where({ place }).firstOrFail()

    return place
  }

  it('refreshes the index favorite state when the guest signs in while viewing it', async () => {
    const email = uniqueEmail('favorites-index')
    const password = 'password123'
    const place = await signUpAndFavorite(email, password, 'Fern Valley Burrow')

    // Reload signed out (in-memory Firebase session is dropped on reload), so the
    // index renders before the bearer exists — like landing on it pre-auth.
    await visit('/', { baseUrl })
    await page.waitForSelector('[data-testid="header-sign-in"]')
    await expect(page).toMatchTextContent('Fern Valley Burrow')
    expect(await page.$(`[data-testid="favorite-toggle-${place.id}"]`)).toBeNull()

    // Sign in without leaving the index page.
    await signInOnCurrentPage(email, password)
    await page.waitForSelector('[data-testid="header-avatar"]')

    // The index must reflect the persisted favorite from a fresh backend fetch,
    // not the stale signed-out payload.
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="true"]`)
    await expect(page).toMatchTextContent('Saved')
  })

  it('refreshes the detail favorite state when the guest signs in while viewing it', async () => {
    const email = uniqueEmail('favorites-detail')
    const password = 'password123'
    const place = await signUpAndFavorite(email, password, 'Cedar Hollow Den')

    // Reload the detail page signed out.
    await visit(`/places/${place.id}`, { baseUrl })
    await page.waitForSelector('[data-testid="place-detail-title"]')
    expect(await page.$(`[data-testid="favorite-toggle-${place.id}"]`)).toBeNull()

    // Sign in without leaving the detail page; the toggle appears once signed in.
    await signInOnCurrentPage(email, password)

    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="true"]`)
  })
})
