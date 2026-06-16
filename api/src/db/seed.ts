import '../conf/loadEnv.js'

import AppEnv from '../conf/AppEnv.js'
import Place from '../app/models/Place.js'
import Room from '../app/models/Room.js'
import Bathroom from '../app/models/Room/Bathroom.js'
import Bedroom from '../app/models/Room/Bedroom.js'
import Kitchen from '../app/models/Room/Kitchen.js'
import { type PlaceStylesEnum } from '../types/db.js'

export default async function seed() {
  if (AppEnv.isTest) return

  await seedPlace({ name: 'Grey Pine Cottage', style: 'cottage', sleeps: 2, title: 'Grey Pine Cottage' })
  const cabin = await seedPlace({
    name: 'Riverbend Cabin',
    style: 'cabin',
    sleeps: 4,
    title: 'Riverbend Cabin',
  })
  await seedPlace({
    name: 'High Branch Treehouse',
    style: 'treehouse',
    sleeps: 3,
    title: 'High Branch Treehouse',
  })

  await seedKitchen(cabin, 'Kitchen', ['oven', 'dishwasher'])
  await seedBedroom(cabin, 'Bedroom', ['cot', 'bunk'])
  await seedBathroom(cabin, 'Bathroom', 'shower')
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

  return place
}

async function seedKitchen(place: Place, title: string, appliances: Kitchen['appliances']) {
  const kitchen =
    (await Kitchen.where({ placeId: place.id }).first()) || (await Kitchen.create({ place, appliances }))
  await kitchen.update({ appliances })
  await seedLocalizedTitle(kitchen, title)
}

async function seedBedroom(place: Place, title: string, bedTypes: Bedroom['bedTypes']) {
  const bedroom =
    (await Bedroom.where({ placeId: place.id }).first()) || (await Bedroom.create({ place, bedTypes }))
  await bedroom.update({ bedTypes })
  await seedLocalizedTitle(bedroom, title)
}

async function seedBathroom(place: Place, title: string, bathOrShowerStyle: Bathroom['bathOrShowerStyle']) {
  const bathroom =
    (await Bathroom.where({ placeId: place.id }).first()) ||
    (await Bathroom.create({ place, bathOrShowerStyle }))
  await bathroom.update({ bathOrShowerStyle })
  await seedLocalizedTitle(bathroom, title)
}

async function seedLocalizedTitle(localizable: Place | Room, title: string) {
  const localizedText = await localizable
    .associationQuery('localizedTexts', { and: { locale: 'en-US' } })
    .first()

  if (localizedText) {
    await localizedText.update({ title })
  } else {
    await localizable.createAssociation('localizedTexts', { locale: 'en-US', title })
  }
}
