import AppEnv from '@conf/AppEnv.js'
import Place from '@models/Place.js'
import Room from '@models/Room.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'
import { randomUUID } from 'node:crypto'

describe('client bookings', () => {
  it('lets a signed-in guest book a place', async () => {
    const place = await createPlace({ name: 'riverbend-cabin', style: 'cabin', sleeps: 4 })
    await setPlaceTitle(place, 'Riverbend Cabin')

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await fillIn('[name="signup-name"]', 'Maple Bear')
    await fillIn('[name="signup-email"]', `front-end-bookings-${randomUUID()}@example.com`)
    await fillIn('[name="signup-password"]', 'bearbnb-password')
    await clickButton('Create account')

    await expect(page).toMatchTextContent('Signed in as Maple Bear')
    await expect(page).toMatchTextContent('Available places')
    await expect(page).toMatchTextContent('Riverbend Cabin')
    await page.$$eval('a', links => {
      const link = links.find(link => link.textContent?.includes('Riverbend Cabin'))
      if (!link) throw new Error('Riverbend Cabin link was not rendered')
      link.click()
    })

    await expect(page).toMatchTextContent('Reserve this place')

    await fillIn('[name="starts-on"]', '2026-07-01')
    await fillIn('[name="ends-on"]', '2026-07-03')
    await clickButton('Book place')

    await expect(page).toMatchTextContent('Booked Riverbend Cabin.')
  })
})

async function setPlaceTitle(localizable: Place | Room, title: string) {
  const localizedText = await localizable
    .associationQuery('localizedTexts', { and: { locale: 'en-US' } })
    .firstOrFail()
  await localizedText.update({ title })
}
