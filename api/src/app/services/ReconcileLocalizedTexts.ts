import Host from '#models/Host.js'
import Place from '#models/Place.js'
import Room from '#models/Room.js'
import { type LocalesEnum } from '#src/types/db.js'
import { DEFAULT_LOCALE } from '#src/utils/i18n.js'
import { Dream, DreamTransaction } from '@rvoh/dream'

export type LocalizedTextParams = Partial<{
  locale: LocalesEnum | undefined
  title: string | null | undefined
  markdown: string | null | undefined
}>

export default class ReconcileLocalizedTexts {
  // The default locale's title and description must always be provided, since Visitor reads fall
  // back to it when a requested locale has no text
  public static hasDefaultText(localizedTexts: LocalizedTextParams[]) {
    const defaultText = localizedTexts.find(text => text.locale === DEFAULT_LOCALE)
    return !!defaultText?.title && !!defaultText.markdown
  }

  // Upserts each provided locale's text through the owning Host, Place or Room, and (with
  // removeMissing) removes non-default locales the localizable no longer provides. The default
  // locale is always retained. Ownership is already proven by loading the localizable through the
  // current Host, so this performs no separate reverse-lookup authorization.
  public static async call(
    localizable: Host | Place | Room,
    localizedTexts: LocalizedTextParams[],
    txn: DreamTransaction<Dream>,
    { removeMissing = false }: { removeMissing?: boolean } = {},
  ) {
    for (const { locale, title, markdown } of localizedTexts) {
      if (!locale) continue

      const existing = await localizable
        .txn(txn)
        .associationQuery('localizedTexts', { and: { locale } })
        .first()

      if (existing) {
        await existing.txn(txn).update({ title, markdown })
      } else {
        await localizable.txn(txn).createAssociation('localizedTexts', { locale, title, markdown })
      }
    }

    if (!removeMissing) return

    const providedLocales = localizedTexts.map(localizedText => localizedText.locale)
    const existingTexts = await localizable.txn(txn).associationQuery('localizedTexts').all()

    for (const existing of existingTexts) {
      if (existing.locale !== DEFAULT_LOCALE && !providedLocales.includes(existing.locale))
        await existing.txn(txn).destroy()
    }
  }
}
