import AppEnv from '@conf/AppEnv.js'
import Place from '@models/Place.js'
import User from '@models/User.js'
import { visit } from '@rvoh/psychic-spec-helpers'

// Drives the full Host management workflow through the client: a signed-in User
// becomes a Host, creates a Place with default and optional localized text, views it
// in the index/show flow, creates a Room, edits Place and Room localized text, and
// deletes the Room and Place through the shared confirmation dialog.
//
// The Firebase emulator session is in-memory and is dropped by a full page load, so
// after signing up on /auth the spec reaches the Host surface via the in-app "Hosting"
// link (client-side navigation) rather than another `visit()`.
describe('host management workflow', () => {
  const baseUrl = AppEnv.string('CLIENT_APP_HOST')

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`
  }

  async function clearAndType(selector: string, value: string) {
    const el = await page.waitForSelector(selector)
    // Triple-click selects the field's current contents so the type replaces them.
    await el!.click({ clickCount: 3 })
    await page.type(selector, value)
  }

  it('takes a new Host from onboarding through create, edit, and delete of a Place and Room', async () => {
    const email = uniqueEmail('host')

    // Sign up a real user against the Firebase emulator, landing signed-in on the home page.
    await visit('/auth', { baseUrl })
    await page.waitForSelector('[data-testid="auth-submit"]')
    await page.type('[name="signup-name"]', 'Ursa Major')
    await page.type('[name="signup-email"]', email)
    await page.type('[name="signup-password"]', 'password123')
    await page.click('[data-testid="auth-accept-terms"]')
    await page.click('[data-testid="auth-submit"]')
    await page.waitForSelector('[data-testid="header-avatar"]')

    // Enter the Host surface via client-side navigation (preserves the session). A User
    // who is not yet a Host lands on the onboarding form.
    await page.click('[data-testid="home-hosting-link"]')
    await page.waitForSelector('[data-testid="host-onboarding"]')

    // Become a Host: legal setup + required en-US profile + optional es-ES profile.
    await page.type('[data-testid="host-onboarding-legal-name"]', 'Ursa Major Holdings')
    await page.type('[data-testid="host-onboarding-en-title"]', 'Ursa the host')
    await page.type('[data-testid="host-onboarding-en-description"]', 'Bear-friendly stays')
    await page.click('[data-testid="host-onboarding-add-spanish"]')
    await page.type('[data-testid="host-onboarding-es-title"]', 'Ursa anfitriona')
    await page.type('[data-testid="host-onboarding-es-description"]', 'Estancias para osos')
    await page.click('[data-testid="host-onboarding-agreement"]')
    await page.click('[data-testid="host-onboarding-submit"]')

    // Once the Host exists the index shows the empty state with a create action.
    await page.waitForSelector('[data-testid="host-places-empty"]')

    // The User is now a Host in the database.
    const user = await User.where({ email }).firstOrFail()
    expect(await user.associationQuery('host').first()).not.toBeNull()

    // Create a Place with default (en-US) and optional (es-ES) localized text.
    await page.click('[data-testid="host-place-new"]')
    await page.waitForSelector('[data-testid="host-place-new-form"]')
    await page.type('[data-testid="host-place-name"]', 'Cedar Lodge Cabin')
    await page.select('[data-testid="host-place-style"]', 'cottage')
    await page.type('[data-testid="host-place-sleeps"]', '3')
    await page.type('[data-testid="host-place-en-title"]', 'Cedar Lodge')
    await page.type('[data-testid="host-place-en-description"]', 'A cozy retreat by the river')
    await page.click('[data-testid="host-place-add-spanish"]')
    await page.type('[data-testid="host-place-es-title"]', 'Cabaña de Cedro')
    await page.type('[data-testid="host-place-es-description"]', 'Un refugio acogedor')
    await page.click('[data-testid="host-place-submit"]')

    // Land on the Host Place show page with both localized rows and an empty Rooms section.
    await page.waitForSelector('[data-testid="host-place-detail"]')
    const placeUrl = page.url()
    const placeId = placeUrl.split('/host/places/')[1]!.split('/')[0]!
    await expect(page).toMatchTextContent('Cedar Lodge Cabin')
    await expect(page).toMatchTextContent('Cedar Lodge')
    await expect(page).toMatchTextContent('Cabaña de Cedro')
    await page.waitForSelector('[data-testid="host-rooms-empty"]')

    // Create a Bedroom with a type-specific field and localized text.
    await page.click('[data-testid="host-room-new"]')
    await page.waitForSelector('[data-testid="host-room-new-form"]')
    await page.select('[data-testid="host-room-type"]', 'Bedroom')
    await page.waitForSelector('[data-testid="host-room-bed-types"]')
    await page.click('[data-testid="host-room-bed-type-twin"]')
    await page.type('[data-testid="host-room-en-title"]', 'Sunrise Room')
    await page.type('[data-testid="host-room-en-description"]', 'Faces the morning light')
    await page.click('[data-testid="host-room-submit"]')

    // Land on the Host Room show page.
    await page.waitForSelector('[data-testid="host-room-detail"]')
    await expect(page).toMatchTextContent('Sunrise Room')

    // Edit the Room's localized text; the type is fixed after creation.
    await page.click('[data-testid="host-room-edit"]')
    await page.waitForSelector('[data-testid="host-room-edit-form"]')
    await page.waitForSelector('[data-testid="host-room-type-fixed"]')
    await clearAndType('[data-testid="host-room-en-title"]', 'Sunrise Suite')
    await page.click('[data-testid="host-room-submit"]')
    await page.waitForSelector('[data-testid="host-room-detail"]')
    await expect(page).toMatchTextContent('Sunrise Suite')

    // Delete the Room through the shared confirmation dialog (shows the Room title).
    await page.click('[data-testid="host-room-delete"]')
    await page.waitForSelector('[data-testid="confirm-dialog"]')
    await expect(page).toMatchTextContent('Sunrise Suite')
    await page.click('[data-testid="confirm-dialog-confirm"]')

    // Back on the Place show page, the Rooms section is empty again.
    await page.waitForSelector('[data-testid="host-place-detail"]')
    await page.waitForSelector('[data-testid="host-rooms-empty"]')

    // Edit the Place: change the default-locale title and remove the Spanish row.
    await page.click('[data-testid="host-place-edit"]')
    await page.waitForSelector('[data-testid="host-place-edit-form"]')
    await clearAndType('[data-testid="host-place-en-title"]', 'Cedar Lodge Retreat')
    await page.click('[data-testid="host-place-remove-spanish"]')
    await page.click('[data-testid="host-place-submit"]')

    // The show page reflects the new title and the Spanish row is gone.
    await page.waitForSelector('[data-testid="host-place-detail"]')
    await expect(page).toMatchTextContent('Cedar Lodge Retreat')
    const localizedText = await page.$eval(
      '[data-testid="host-place-localized-list"]',
      el => el.textContent ?? '',
    )
    expect(localizedText).not.toContain('Cabaña de Cedro')

    // Delete the Place through the shared confirmation dialog (shows the Place name).
    await page.click('[data-testid="host-place-delete"]')
    await page.waitForSelector('[data-testid="confirm-dialog"]')
    await expect(page).toMatchTextContent('Cedar Lodge Cabin')
    await page.click('[data-testid="confirm-dialog-confirm"]')

    // Returns to the Host Places index, which is empty again.
    await page.waitForSelector('[data-testid="host-places-empty"]')

    // The Place is gone from the database.
    expect(await Place.find(placeId)).toBeNull()
  })
})
