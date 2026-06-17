import AppEnv from '@conf/AppEnv.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('client authentication', () => {
  it('lets a guest sign up, sign out, and sign back in', async () => {
    const email = 'front-end-auth@example.com'
    const password = 'bearbnb-password'

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await expect(page).toMatchTextContent('Available places')
    await clickLink('Sign in')

    await fillIn('[name="signup-name"]', 'Maple Bear')
    await fillIn('[name="signup-email"]', email)
    await fillIn('[name="signup-password"]', password)
    await clickButton('Create account')

    await expect(page).toMatchTextContent('Signed in as Maple Bear')
    await page.$$eval('body', ([body]) => {
      if (body?.textContent?.includes('Your guest account')) {
        throw new Error('The full guest account card was rendered after sign-in')
      }
      if (body?.textContent?.includes('Find your next place.')) {
        throw new Error('The places index still rendered the onboarding hero')
      }
    })

    await clickButton('Sign out')
    await expect(page).toMatchTextContent('Sign in')

    await clickLink('Sign in')
    await clickButton('Returning')
    await fillIn('[name="signin-email"]', email)
    await fillIn('[name="signin-password"]', password)
    await clickButton('Sign in')

    await expect(page).toMatchTextContent('Signed in as Maple Bear')
  })
})
