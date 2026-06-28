import AppEnv from '@conf/AppEnv.js'
import { CURRENT_TOS_VERSION } from '@conf/termsOfService.js'
import User from '@models/User.js'
import { visit } from '@rvoh/psychic-spec-helpers'

const EMULATOR_HOST = 'http://127.0.0.1:9099'
const EMULATOR_SIGNUP_URL = `${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`

describe('guest sign-up and sign-in', () => {
  const baseUrl = AppEnv.string('CLIENT_APP_HOST')

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`
  }

  async function createEmulatorUser(email: string, password: string) {
    const response = await fetch(EMULATOR_SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    })
    if (!response.ok) throw new Error(`Firebase emulator sign-up failed: ${await response.text()}`)
  }

  it('signs up a new guest, records terms consent, and provisions the backend user', async () => {
    const email = uniqueEmail('signup')

    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')

    await page.type('[name="signup-name"]', 'Maple Bear')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', 'password123')
    await page.click('[data-testid="auth-accept-terms"]')
    await page.click('[data-testid="auth-submit"]')

    await page.waitForSelector('[data-testid="header-avatar"]')

    const user = await User.findBy({ email })
    expect(user).not.toBeNull()
    expect(user!.tosVersion).toEqual(CURRENT_TOS_VERSION)
    expect(user!.tosAcceptedAt).not.toBeNull()

    const guestCount = await user!.associationQuery('guest').count()
    expect(guestCount).toEqual(1)
  })

  it('blocks sign-up until the terms of service are accepted', async () => {
    const email = uniqueEmail('noterms')

    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')

    await page.type('[name="signup-name"]', 'No Terms')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', 'password123')
    await page.click('[data-testid="auth-submit"]')

    await page.waitForSelector('[data-testid="auth-error"]')
    await expect(page).toMatchTextContent(/terms of service/i)

    expect(await User.where({ email }).exists()).toBe(false)
  })

  it('signs in a returning guest against the Firebase emulator', async () => {
    const email = uniqueEmail('signin')
    const password = 'password123'
    await createEmulatorUser(email, password)

    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-tab-signin"]')
    await page.click('[data-testid="auth-tab-signin"]')

    await page.waitForSelector('[name="signin-email"]')
    await page.type('[name="signin-email"]', email)
    await page.type('[name="signin-password"]', password)
    await page.click('[data-testid="auth-submit"]')

    await page.waitForSelector('[data-testid="header-avatar"]')

    const user = await User.findBy({ email })
    expect(user).not.toBeNull()
  })
})
