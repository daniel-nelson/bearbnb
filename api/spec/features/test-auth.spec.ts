import AppEnv from '@conf/AppEnv.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('guest authentication', () => {
  it('supports the test auth adapter for browser product specs', async () => {
    const email = `guest-${Date.now()}@example.com`
    const password = 'bearbnb-password'

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await page.click('[data-testid="auth-email"]', { clickCount: 3 })
    await page.type('[data-testid="auth-email"]', email)
    await page.click('[data-testid="auth-password"]', { clickCount: 3 })
    await page.type('[data-testid="auth-password"]', password)
    await page.click('[data-testid="test-auth-submit"]')

    await expect(page).toMatchTextContent('Bearer token accepted by Psychic.')
    await expect(page).toMatchTextContent(email)

    await clickButton('Sign out')
    await expect(page).toMatchTextContent('Create account')

    await clickButton('Sign in')
    await page.click('[data-testid="auth-email"]', { clickCount: 3 })
    await page.type('[data-testid="auth-email"]', email)
    await page.click('[data-testid="auth-password"]', { clickCount: 3 })
    await page.type('[data-testid="auth-password"]', password)
    await page.click('[data-testid="test-auth-submit"]')

    await expect(page).toMatchTextContent(email)
  })
})

async function clickButton(text: string) {
  const clicked = await page.evaluate(label => {
    const button = [...document.querySelectorAll('button')].find(
      button => button.textContent?.trim() === label,
    )
    if (!button) return false
    button.click()
    return true
  }, text)

  expect(clicked).toBe(true)
}
