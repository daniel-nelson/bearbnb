import createLocalizedText from '@spec/factories/LocalizedTextFactory.js'
import createPlace from '@spec/factories/PlaceFactory.js'
import createBedroom from '@spec/factories/Room/BedroomFactory.js'
import createDen from '@spec/factories/Room/DenFactory.js'
import createKitchen from '@spec/factories/Room/KitchenFactory.js'

describe('Room', () => {
  it('has many LocalizedTexts', async () => {
    const room = await createDen()
    const esLocalizedText = await createLocalizedText({ localizable: room, locale: 'es-ES' })

    const localizedText = await room.associationQuery('localizedTexts', { and: { locale: 'es-ES' } }).last()
    expect(localizedText).toMatchDreamModel(esLocalizedText)
  })

  context('upon creation', () => {
    it('creates en-US LocalizedText for the Room', async () => {
      const room = await createDen()
      const localizedText = await room.associationQuery('localizedTexts').firstOrFail()

      expect(localizedText.locale).toEqual('en-US')
    })
  })

  it('has one currentLocalizedText', async () => {
    let room = await createDen()
    const esLocalizedText = await createLocalizedText({ localizable: room, locale: 'es-ES' })

    room = await room.passthrough({ locale: 'es-ES' }).load('currentLocalizedText').execute()

    expect(room.currentLocalizedText).toMatchDreamModel(esLocalizedText)
  })

  describe('position', () => {
    it('is automatically set and scoped to Place', async () => {
      const place = await createPlace()
      const kitchen = await createKitchen({ place })
      const otherBedroom = await createBedroom()
      const bedroom = await createBedroom({ place })

      expect(kitchen.position).toEqual(1)
      expect(bedroom.position).toEqual(2)
      expect(otherBedroom.position).toEqual(1)
    })
  })
})
