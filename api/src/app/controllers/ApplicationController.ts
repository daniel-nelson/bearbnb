import { PsychicController } from '@rvoh/psychic'
import { PsychicOpenapiNames } from '@rvoh/psychic/openapi'
import psychicTypes from '#src/types/psychic.js'
import { DEFAULT_LOCALE, supportedLocales } from '#src/utils/i18n.js'

export default class ApplicationController extends PsychicController {
  public override get psychicTypes() {
    return psychicTypes
  }

  public static override get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['default', 'mobile', 'tests']
  }

  // The supported locale (src/utils/i18n.ts) the request's Accept-Language
  // header prefers, else DEFAULT_LOCALE. Koa does the negotiation (its accepts
  // and negotiator packages), weighing q-values and matching a bare 'es' to
  // 'es-ES', so a Koa update, not an edit here, brings its fixes. Koa answers a
  // request with no header, or with `*`, with the first locale it is given, so
  // DEFAULT_LOCALE goes first
  protected get locale() {
    const locales = [DEFAULT_LOCALE, ...supportedLocales().filter(locale => locale !== DEFAULT_LOCALE)]
    return (this.ctx.acceptsLanguages(...locales) || DEFAULT_LOCALE) as (typeof locales)[number]
  }
}
