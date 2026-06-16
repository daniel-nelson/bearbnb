import '../conf/loadEnv.js'

import AppEnv from '../conf/AppEnv.js'
import Place from '../app/models/Place.js'
import { type PlaceStylesEnum } from '../types/db.js'

export default async function seed() {
  if (AppEnv.isTest) return

  await seedPlace({ name: 'Grey Pine Cottage', style: 'cottage', sleeps: 2, title: 'Grey Pine Cottage' })
  await seedPlace({ name: 'Riverbend Cabin', style: 'cabin', sleeps: 4, title: 'Riverbend Cabin' })
  await seedPlace({
    name: 'High Branch Treehouse',
    style: 'treehouse',
    sleeps: 3,
    title: 'High Branch Treehouse',
  })
}

async function seedPlace({
  name,
  style,
  sleeps,
  title,
}: {
  name: string
  style: PlaceStylesEnum
  sleeps: number
  title: string
}) {
  const place = (await Place.findBy({ name })) || (await Place.create({ name, style, sleeps }))

  await place.update({ style, sleeps })
  await seedLocalizedTitle(place, title)
}

async function seedLocalizedTitle(place: Place, title: string) {
  const localizedText = await place.associationQuery('localizedTexts', { and: { locale: 'en-US' } }).first()

  if (localizedText) {
    await localizedText.update({ title })
  } else {
    await place.createAssociation('localizedTexts', { locale: 'en-US', title })
  }
}
