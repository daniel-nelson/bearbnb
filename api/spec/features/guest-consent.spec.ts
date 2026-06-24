import AppEnv from '@conf/AppEnv.js'
import Favorite from '@models/Favorite.js'
import User from '@models/User.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest terms-of-service consent enforcement', () => {
  const baseUrl = AppEnv.string('CLIENT_APP_HOST')

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`
  }

  // Creates a Firebase account and signs in WITHOUT recording backend consent,
  // reproducing a user provisioned by browsing who never accepted the terms.
  async function signUpWithoutConsentOnCurrentPage(email: string, password: string) {
    await page.evaluate(
      async (e: string, p: string) => {
        await (
          window as unknown as {
            __testSignUpWithoutConsent: (email: string, password: string) => Promise<unknown>
          }
        ).__testSignUpWithoutConsent(e, p)
      },
      email,
      password,
    )
  }

  it('blocks a provisioned-but-unconsented guest from favoriting until they accept the terms', async () => {
    const email = uniqueEmail('consent')
    const place = await createPlace()
    await (
      await place.associationQuery('localizedTexts').firstOrFail()
    ).update({ title: 'Thornbush Retreat' })

    // Land on the index signed out, then sign in without recording consent. The
    // page is already mounted, so it refetches once the bearer is available,
    // provisioning the backend user (with no consent) and revealing the toggle.
    await visit('/', { baseUrl })
    await page.waitForSelector('[data-testid="header-sign-in"]')
    await expect(page).toMatchTextContent('Thornbush Retreat')

    await signUpWithoutConsentOnCurrentPage(email, 'password123')
    await page.waitForSelector('[data-testid="header-avatar"]')

    const user = await User.findOrFailBy({ email })
    expect(user.tosAcceptedAt).toBeNull()

    // Attempting to favorite is refused by the consent gate; nothing is saved.
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.click(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.waitForSelector('[data-testid="consent-gate"]')
    expect(await Favorite.where({ place }).first()).toBeNull()

    // Accept the terms; the gate records consent and closes.
    await page.click('[data-testid="consent-gate-accept"]')
    await page.waitForSelector('[data-testid="consent-gate"]', { hidden: true })

    await user.reload()
    expect(user.tosAcceptedAt).not.toBeNull()

    // Retrying the favorite now succeeds.
    await page.click(`[data-testid="favorite-toggle-${place.id}"]`)
    await page.waitForSelector(`[data-testid="favorite-toggle-${place.id}"][aria-pressed="true"]`)

    const favorite = await Favorite.where({ place }).firstOrFail()
    const guest = await favorite.associationQuery('guest').firstOrFail()
    const favoritedByUser = await guest.associationQuery('user').firstOrFail()
    expect(favoritedByUser.email).toEqual(email)
  })
})
