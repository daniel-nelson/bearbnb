import AppEnv from '@conf/AppEnv.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import { visit } from '@rvoh/psychic-spec-helpers'

describe('visitor places index', () => {
  it('shows places loaded from the Psychic API', async () => {
    const firstPlace = await createPlace()
    await (
      await firstPlace.associationQuery('localizedTexts').firstOrFail()
    ).update({ title: 'Mossy Hollow Den' })
    const secondPlace = await createPlace()
    await (
      await secondPlace.associationQuery('localizedTexts').firstOrFail()
    ).update({
      title: 'Cedar Ridge Cabin',
    })

    await visit('/', { baseUrl: AppEnv.string('CLIENT_APP_HOST') })

    await expect(page).toMatchTextContent('Available places')
    await expect(page).toMatchTextContent('Mossy Hollow Den')
    await expect(page).toMatchTextContent('Cedar Ridge Cabin')
  })
})
