import createLocalizedText from '@spec/factories/LocalizedTextFactory.js'
import createDen from '@spec/factories/Room/DenFactory.js'

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
})
