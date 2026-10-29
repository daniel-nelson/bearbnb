import locales from '#conf/locales/index.js'
import { BASE_LOCALE } from '#src/utils/i18n.js'
import { I18nProvider } from '@rvoh/psychic/system'

// Checks every locale in src/conf/locales against BASE_LOCALE, the base locale
// src/utils/i18n.ts passes to I18nProvider.provide.
//
// localeDifferences returns one readable line per difference, and this spec
// fails listing them, when a locale:
//   - is missing a key the base locale has
//   - has a key the base locale doesn't
//   - has a string where the base has nested translations, or the reverse
//   - uses different %{...} placeholders than the base's text for that key
//
// At runtime a key missing from a locale quietly falls back to the base
// locale's text, so without this spec a missing translation only shows up as
// untranslated text in front of a user.
describe('locales', () => {
  it('match the base locale key for key and placeholder for placeholder', () => {
    expect(I18nProvider.localeDifferences(locales, BASE_LOCALE)).toEqual([])
  })
})
