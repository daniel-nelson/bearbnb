import AppEnv from '@conf/AppEnv.js'
import { CalendarDate } from '@rvoh/dream'
import Place from '@models/Place.js'
import Room from '@models/Room.js'
import createBooking from '@spec/factories/BookingFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'
import { randomUUID } from 'node:crypto'

describe('client bookings', () => {
  it('lets a signed-in guest book a place', async () => {
    const place = await createPlace({ name: 'riverbend-cabin', style: 'cabin', sleeps: 4 })
    await setPlaceTitle(place, 'Riverbend Cabin')

    await visit('/auth', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

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

    await page.click('button[aria-label="Next month"]')
    await clickCalendarDate('July 1, 2026')
    await clickCalendarDate('July 3, 2026')
    await clickButton('Book place')

    await expect(page).toMatchTextContent('Booked Riverbend Cabin.')
  })

  it('greys out already-booked dates', async () => {
    const place = await createPlace({ name: 'riverbend-cabin', style: 'cabin', sleeps: 4 })
    await setPlaceTitle(place, 'Riverbend Cabin')
    await createBooking({
      place,
      startsOn: CalendarDate.fromISO('2026-07-02'),
      endsOn: CalendarDate.fromISO('2026-07-02'),
    })

    await visitPlace(place)

    await page.click('button[aria-label="Next month"]')
    await page.$eval('button[aria-label="July 2, 2026"]', button => {
      if (!button.hasAttribute('disabled')) throw new Error('Booked calendar date was not disabled')
    })
  })
})

async function visitPlace(place: Place) {
  await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })
  await expect(page).toMatchTextContent('Riverbend Cabin')
  await page.$$eval(
    'a',
    (links, placeId) => {
      const link = links.find(link => link.getAttribute('href') === `/places/${placeId}`)
      if (!link) throw new Error('Place link was not rendered')
      link.click()
    },
    place.id,
  )
  await expect(page).toMatchTextContent('Reserve this place')
}

async function clickCalendarDate(label: string) {
  await page.click(`button[aria-label="${label}"]`)
}

async function setPlaceTitle(localizable: Place | Room, title: string) {
  const localizedText = await localizable
    .associationQuery('localizedTexts', { and: { locale: 'en-US' } })
    .firstOrFail()
  await localizedText.update({ title })
}
