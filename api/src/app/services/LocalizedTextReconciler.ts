import { DreamTransaction } from '@rvoh/dream'
import { DreamParamSafeColumnNames } from '@rvoh/dream/types'
import ApplicationModel from '@models/ApplicationModel.js'
import Host from '@models/Host.js'
import LocalizedText from '@models/LocalizedText.js'
import Place from '@models/Place.js'
import Room from '@models/Room.js'
import { LocalesEnum } from '@src/types/db.js'

export const DEFAULT_LOCALE: LocalesEnum = 'en-US'

export const localizedTextParams: DreamParamSafeColumnNames<LocalizedText>[] = ['locale', 'title', 'markdown']

export type LocalizedTextParams = Partial<{
  locale: LocalesEnum
  title: string | null
  markdown: string | null
}>

// Any model that owns a polymorphic `localizedTexts` HasMany. All three speak the same
// multi-locale owner-endpoint contract, so they share one reconciler rather than each
// pasting its own copy.
type LocalizedTextOwner = Host | Place | Room

// Upserts each provided locale's text through the owning model, and (on update) removes
// non-default locales the owner no longer provides. `en-US` is always retained so Visitor
// reads can fall back to it. Ownership is already proven by loading the owner from the
// current User/Host, so this performs no separate reverse-lookup authorization.
export async function reconcileLocalizedTexts(
  owner: LocalizedTextOwner,
  localizedTexts: LocalizedTextParams[],
  txn: DreamTransaction<ApplicationModel>,
  { removeMissing = false }: { removeMissing?: boolean } = {},
) {
  for (const { locale, title, markdown } of localizedTexts) {
    if (!locale) continue

    const existing = await owner.txn(txn).associationQuery('localizedTexts', { and: { locale } }).first()

    if (existing) {
      await existing.txn(txn).update({ title, markdown })
    } else {
      await owner.txn(txn).createAssociation('localizedTexts', { locale, title, markdown })
    }
  }

  if (!removeMissing) return

  const providedLocales = localizedTexts.map(localizedText => localizedText.locale)
  const existingTexts = await owner.txn(txn).associationQuery('localizedTexts').all()

  for (const existing of existingTexts) {
    if (existing.locale !== DEFAULT_LOCALE && !providedLocales.includes(existing.locale))
      await existing.txn(txn).destroy()
  }
}
