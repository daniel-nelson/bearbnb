import locales from '#conf/locales/index.js'
import { I18nProvider } from '@rvoh/psychic/system'
import { LocalesEnumValues } from '#src/types/db.js'

// The request language tags the app accepts: the database enum of locales
// (src/types/db.ts), so the supported locales are defined once, in the
// migration. ApplicationController's locale getter picks the one a request's
// Accept-Language header prefers. Each is served by its language's locale file
// ('en-US' by 'en', 'es-ES' by 'es'). Their order does not matter: Dream lists
// an enum's values alphabetically
export function supportedLocales() {
  return LocalesEnumValues
}

// The supported locale a request gets when its Accept-Language header is
// missing, is `*` or accepts none of them
export const DEFAULT_LOCALE: ReturnType<typeof supportedLocales>[number] = 'en-US'

// The base locale. i18n falls back to it for a key the requested locale is
// missing, and a spec that passes it to I18nProvider.localeDifferences, such
// as spec/unit/conf/locales.spec.ts, checks every other locale against it
export const BASE_LOCALE = 'en'

export default I18nProvider.provide(locales, BASE_LOCALE)
