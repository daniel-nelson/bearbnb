import '../conf/loadEnv.js'

import AppEnv from '../conf/AppEnv.js'
import Place from '../app/models/Place.js'
import Room from '../app/models/Room.js'
import Bathroom from '../app/models/Room/Bathroom.js'
import Bedroom from '../app/models/Room/Bedroom.js'
import Den from '../app/models/Room/Den.js'
import Kitchen from '../app/models/Room/Kitchen.js'
import LivingRoom from '../app/models/Room/LivingRoom.js'
import { type PlaceStylesEnum } from '../types/db.js'

export default async function seed() {
  if (AppEnv.isTest) return

  for (const placeSeed of placeSeeds) {
    await seedPlaceWithRooms(placeSeed)
  }
}

const placeSeeds: PlaceSeed[] = [
  {
    name: 'Grey Pine Cottage',
    style: 'cottage',
    sleeps: 2,
    title: 'Grey Pine Cottage',
    bedrooms: [{ title: 'Bedroom', bedTypes: ['queen'] }],
    bathrooms: [{ title: 'Bathroom', bathOrShowerStyle: 'bath_and_shower' }],
  },
  {
    name: 'Riverbend Cabin',
    style: 'cabin',
    sleeps: 4,
    title: 'Riverbend Cabin',
    bedrooms: [{ title: 'Bunk Room', bedTypes: ['cot', 'bunk'] }],
    bathrooms: [{ title: 'Bathroom', bathOrShowerStyle: 'shower' }],
    kitchens: [{ title: 'Kitchen', appliances: ['oven', 'dishwasher'] }],
    livingRooms: ['Sitting Room'],
  },
  {
    name: 'High Branch Treehouse',
    style: 'treehouse',
    sleeps: 3,
    title: 'High Branch Treehouse',
    bedrooms: [
      { title: 'Loft Bedroom', bedTypes: ['queen'] },
      { title: 'Nest Room', bedTypes: ['twin'] },
    ],
    bathrooms: [{ title: 'Bathhouse', bathOrShowerStyle: 'shower' }],
  },
  {
    name: 'Mossbank Lodge',
    style: 'cabin',
    sleeps: 14,
    title: 'Mossbank Lodge',
    bedrooms: [
      { title: 'Primary Suite', bedTypes: ['king'] },
      { title: 'North Bedroom', bedTypes: ['queen'] },
      { title: 'South Bedroom', bedTypes: ['queen'] },
      { title: 'Cub Bunkroom', bedTypes: ['bunk', 'bunk'] },
      { title: 'Guest Bedroom', bedTypes: ['twin', 'twin'] },
      { title: 'Den Sleeper', bedTypes: ['sofabed'] },
    ],
    bathrooms: [
      { title: 'Primary Bath', bathOrShowerStyle: 'bath_and_shower' },
      { title: 'North Bath', bathOrShowerStyle: 'shower' },
      { title: 'South Bath', bathOrShowerStyle: 'bath' },
      { title: 'Bunkroom Bath', bathOrShowerStyle: 'shower' },
      { title: 'Powder Room', bathOrShowerStyle: 'none' },
    ],
    kitchens: [{ title: 'Chef Kitchen', appliances: ['stove', 'oven', 'microwave', 'dishwasher'] }],
    livingRooms: ['Great Room'],
    dens: ['Game Den'],
  },
  {
    name: 'Cedar Hollow Cave',
    style: 'cave',
    sleeps: 6,
    title: 'Cedar Hollow Cave',
    bedrooms: [
      { title: 'Stone Bedroom', bedTypes: ['king'] },
      { title: 'Lower Bedroom', bedTypes: ['bunk'] },
    ],
    bathrooms: [
      { title: 'Steam Bath', bathOrShowerStyle: 'bath' },
      { title: 'Rain Shower', bathOrShowerStyle: 'shower' },
    ],
    kitchens: [{ title: 'Galley Kitchen', appliances: ['stove', 'microwave'] }],
  },
  {
    name: 'Fern Ridge Tent',
    style: 'tent',
    sleeps: 2,
    title: 'Fern Ridge Tent',
    bedrooms: [{ title: 'Canvas Bedroom', bedTypes: ['queen'] }],
    bathrooms: [{ title: 'Private Washroom', bathOrShowerStyle: 'shower' }],
  },
  {
    name: 'Blue Spruce Lean-To',
    style: 'lean_to',
    sleeps: 2,
    title: 'Blue Spruce Lean-To',
    bedrooms: [{ title: 'Sleeping Platform', bedTypes: ['cot'] }],
    bathrooms: [{ title: 'Camp Bathroom', bathOrShowerStyle: 'none' }],
  },
  {
    name: 'Blackberry Dump',
    style: 'dump',
    sleeps: 3,
    title: 'Blackberry Dump',
    bedrooms: [{ title: 'Salvage Bedroom', bedTypes: ['sofabed', 'twin'] }],
    bathrooms: [{ title: 'Tin Bath', bathOrShowerStyle: 'bath' }],
  },
  {
    name: 'Sage Creek Cabin',
    style: 'cabin',
    sleeps: 5,
    title: 'Sage Creek Cabin',
    bedrooms: [
      { title: 'Creekside Bedroom', bedTypes: ['queen'] },
      { title: 'Cub Room', bedTypes: ['bunk'] },
    ],
    bathrooms: [
      { title: 'Hall Bath', bathOrShowerStyle: 'bath_and_shower' },
      { title: 'Mudroom Shower', bathOrShowerStyle: 'shower' },
    ],
    kitchens: [{ title: 'Kitchen', appliances: ['stove', 'oven'] }],
  },
  {
    name: 'Willow Moon Cottage',
    style: 'cottage',
    sleeps: 4,
    title: 'Willow Moon Cottage',
    bedrooms: [
      { title: 'Moon Room', bedTypes: ['queen'] },
      { title: 'Willow Room', bedTypes: ['twin', 'twin'] },
    ],
    bathrooms: [{ title: 'Cottage Bath', bathOrShowerStyle: 'bath_and_shower' }],
    livingRooms: ['Parlor'],
  },
  {
    name: 'Granite Paw Cave',
    style: 'cave',
    sleeps: 8,
    title: 'Granite Paw Cave',
    bedrooms: [
      { title: 'Granite Suite', bedTypes: ['king'] },
      { title: 'Paw Bunkroom', bedTypes: ['bunk', 'bunk'] },
      { title: 'Quiet Room', bedTypes: ['queen'] },
    ],
    bathrooms: [
      { title: 'Grotto Bath', bathOrShowerStyle: 'bath' },
      { title: 'Shower Nook', bathOrShowerStyle: 'shower' },
    ],
    dens: ['Reading Den'],
  },
  {
    name: 'Cloudberry Treehouse',
    style: 'treehouse',
    sleeps: 5,
    title: 'Cloudberry Treehouse',
    bedrooms: [
      { title: 'Canopy Bedroom', bedTypes: ['queen'] },
      { title: 'Branch Bunks', bedTypes: ['bunk'] },
    ],
    bathrooms: [{ title: 'Canopy Bath', bathOrShowerStyle: 'shower' }],
    kitchens: [{ title: 'Breakfast Nook', appliances: ['microwave', 'dishwasher'] }],
  },
  {
    name: 'Lakeglass Lodge',
    style: 'cabin',
    sleeps: 10,
    title: 'Lakeglass Lodge',
    bedrooms: [
      { title: 'Lake Suite', bedTypes: ['king'] },
      { title: 'Pine Bedroom', bedTypes: ['queen'] },
      { title: 'Loft Bedroom', bedTypes: ['queen', 'twin'] },
      { title: 'Bunkroom', bedTypes: ['bunk'] },
    ],
    bathrooms: [
      { title: 'Lake Bath', bathOrShowerStyle: 'bath_and_shower' },
      { title: 'Loft Bath', bathOrShowerStyle: 'shower' },
      { title: 'Half Bath', bathOrShowerStyle: 'none' },
    ],
    kitchens: [{ title: 'Lake Kitchen', appliances: ['stove', 'oven', 'dishwasher'] }],
    livingRooms: ['Lakeside Living Room'],
  },
  {
    name: 'Juniper Flats Tent',
    style: 'tent',
    sleeps: 4,
    title: 'Juniper Flats Tent',
    bedrooms: [
      { title: 'Canvas Suite', bedTypes: ['queen'] },
      { title: 'Camp Cots', bedTypes: ['cot', 'cot'] },
    ],
    bathrooms: [{ title: 'Wash Tent', bathOrShowerStyle: 'shower' }],
  },
  {
    name: 'Old Mill Cottage',
    style: 'cottage',
    sleeps: 6,
    title: 'Old Mill Cottage',
    bedrooms: [
      { title: 'Mill Bedroom', bedTypes: ['queen'] },
      { title: 'Loft Bunks', bedTypes: ['bunk'] },
      { title: 'Daybed Room', bedTypes: ['sofabed'] },
    ],
    bathrooms: [
      { title: 'Main Bath', bathOrShowerStyle: 'bath_and_shower' },
      { title: 'Loft Bath', bathOrShowerStyle: 'shower' },
    ],
    kitchens: [{ title: 'Mill Kitchen', appliances: ['stove', 'oven', 'microwave'] }],
  },
  {
    name: 'Sunset Lean-To',
    style: 'lean_to',
    sleeps: 2,
    title: 'Sunset Lean-To',
    bedrooms: [{ title: 'Sunset Platform', bedTypes: ['cot'] }],
    bathrooms: [{ title: 'Trail Bathroom', bathOrShowerStyle: 'none' }],
  },
  {
    name: 'Honeycomb Hideout',
    style: 'cave',
    sleeps: 4,
    title: 'Honeycomb Hideout',
    bedrooms: [
      { title: 'Honey Room', bedTypes: ['queen'] },
      { title: 'Comb Room', bedTypes: ['twin'] },
    ],
    bathrooms: [{ title: 'Hideout Bath', bathOrShowerStyle: 'bath' }],
    dens: ['Snack Den'],
  },
  {
    name: 'Maple Knoll Cabin',
    style: 'cabin',
    sleeps: 7,
    title: 'Maple Knoll Cabin',
    bedrooms: [
      { title: 'Maple Bedroom', bedTypes: ['king'] },
      { title: 'Knoll Bedroom', bedTypes: ['queen'] },
      { title: 'Cub Room', bedTypes: ['bunk'] },
    ],
    bathrooms: [
      { title: 'Maple Bath', bathOrShowerStyle: 'bath_and_shower' },
      { title: 'Knoll Shower', bathOrShowerStyle: 'shower' },
    ],
    kitchens: [{ title: 'Maple Kitchen', appliances: ['stove', 'dishwasher'] }],
  },
  {
    name: 'Aspen Lantern Treehouse',
    style: 'treehouse',
    sleeps: 6,
    title: 'Aspen Lantern Treehouse',
    bedrooms: [
      { title: 'Lantern Suite', bedTypes: ['king'] },
      { title: 'Aspen Bunks', bedTypes: ['bunk', 'twin'] },
    ],
    bathrooms: [
      { title: 'Lantern Bath', bathOrShowerStyle: 'shower' },
      { title: 'Lower Bath', bathOrShowerStyle: 'none' },
    ],
    livingRooms: ['Canopy Lounge'],
  },
  {
    name: 'Thimbleberry Cottage',
    style: 'cottage',
    sleeps: 3,
    title: 'Thimbleberry Cottage',
    bedrooms: [{ title: 'Berry Bedroom', bedTypes: ['queen', 'twin'] }],
    bathrooms: [{ title: 'Berry Bath', bathOrShowerStyle: 'bath_and_shower' }],
    kitchens: [{ title: 'Tiny Kitchen', appliances: ['stove', 'microwave'] }],
  },
  {
    name: 'Driftwood Den',
    style: 'cabin',
    sleeps: 4,
    title: 'Driftwood Den',
    bedrooms: [
      { title: 'Drift Bedroom', bedTypes: ['queen'] },
      { title: 'Wood Room', bedTypes: ['sofabed'] },
    ],
    bathrooms: [{ title: 'Drift Bath', bathOrShowerStyle: 'shower' }],
    dens: ['Puzzle Den'],
  },
  {
    name: 'Copper Creek Dump',
    style: 'dump',
    sleeps: 5,
    title: 'Copper Creek Dump',
    bedrooms: [
      { title: 'Copper Bedroom', bedTypes: ['queen'] },
      { title: 'Creek Cots', bedTypes: ['cot', 'cot'] },
    ],
    bathrooms: [
      { title: 'Copper Bath', bathOrShowerStyle: 'bath' },
      { title: 'Creek Shower', bathOrShowerStyle: 'shower' },
    ],
  },
  {
    name: 'Silver Fir Tent',
    style: 'tent',
    sleeps: 2,
    title: 'Silver Fir Tent',
    bedrooms: [{ title: 'Fir Bedroom', bedTypes: ['queen'] }],
    bathrooms: [{ title: 'Fir Washroom', bathOrShowerStyle: 'shower' }],
  },
  {
    name: 'Huckleberry Ridge Lodge',
    style: 'cabin',
    sleeps: 12,
    title: 'Huckleberry Ridge Lodge',
    bedrooms: [
      { title: 'Ridge Suite', bedTypes: ['king'] },
      { title: 'Huckleberry Bedroom', bedTypes: ['queen'] },
      { title: 'East Bedroom', bedTypes: ['queen'] },
      { title: 'West Bedroom', bedTypes: ['twin', 'twin'] },
      { title: 'Cub Bunkroom', bedTypes: ['bunk', 'bunk'] },
    ],
    bathrooms: [
      { title: 'Ridge Bath', bathOrShowerStyle: 'bath_and_shower' },
      { title: 'East Bath', bathOrShowerStyle: 'shower' },
      { title: 'West Bath', bathOrShowerStyle: 'bath' },
      { title: 'Half Bath', bathOrShowerStyle: 'none' },
    ],
    kitchens: [{ title: 'Lodge Kitchen', appliances: ['stove', 'oven', 'microwave', 'dishwasher'] }],
    livingRooms: ['Ridge Great Room'],
    dens: ['Media Den'],
  },
]

type BedroomSeed = {
  title: string
  bedTypes: Bedroom['bedTypes']
}

type BathroomSeed = {
  title: string
  bathOrShowerStyle: Bathroom['bathOrShowerStyle']
}

type KitchenSeed = {
  title: string
  appliances: Kitchen['appliances']
}

type PlaceSeed = {
  name: string
  style: PlaceStylesEnum
  sleeps: number
  title: string
  bedrooms: BedroomSeed[]
  bathrooms: BathroomSeed[]
  kitchens?: KitchenSeed[]
  livingRooms?: string[]
  dens?: string[]
}

async function seedPlaceWithRooms(seed: PlaceSeed) {
  const place = await seedPlace(seed)
  await seedBedrooms(place, seed.bedrooms)
  await seedBathrooms(place, seed.bathrooms)
  await seedKitchens(place, seed.kitchens || [])
  await seedLivingRooms(place, seed.livingRooms || [])
  await seedDens(place, seed.dens || [])
}

async function seedPlace({ name, style, sleeps, title }: PlaceSeed) {
  const place = (await Place.findBy({ name })) || (await Place.create({ name, style, sleeps }))

  await place.update({ style, sleeps })
  await seedLocalizedTitle(place, title)

  return place
}

async function seedBedrooms(place: Place, bedrooms: BedroomSeed[]) {
  const existingBedrooms = await Bedroom.where({ placeId: place.id }).all()

  for (const [index, { title, bedTypes }] of bedrooms.entries()) {
    const bedroom = existingBedrooms[index] || (await Bedroom.create({ place, bedTypes }))
    await bedroom.update({ bedTypes })
    await seedLocalizedTitle(bedroom, title)
  }
}

async function seedBathrooms(place: Place, bathrooms: BathroomSeed[]) {
  const existingBathrooms = await Bathroom.where({ placeId: place.id }).all()

  for (const [index, { title, bathOrShowerStyle }] of bathrooms.entries()) {
    const bathroom = existingBathrooms[index] || (await Bathroom.create({ place, bathOrShowerStyle }))
    await bathroom.update({ bathOrShowerStyle })
    await seedLocalizedTitle(bathroom, title)
  }
}

async function seedKitchens(place: Place, kitchens: KitchenSeed[]) {
  const existingKitchens = await Kitchen.where({ placeId: place.id }).all()

  for (const [index, { title, appliances }] of kitchens.entries()) {
    const kitchen = existingKitchens[index] || (await Kitchen.create({ place, appliances }))
    await kitchen.update({ appliances })
    await seedLocalizedTitle(kitchen, title)
  }
}

async function seedLivingRooms(place: Place, titles: string[]) {
  const existingLivingRooms = await LivingRoom.where({ placeId: place.id }).all()

  for (const [index, title] of titles.entries()) {
    const livingRoom = existingLivingRooms[index] || (await LivingRoom.create({ place }))
    await seedLocalizedTitle(livingRoom, title)
  }
}

async function seedDens(place: Place, titles: string[]) {
  const existingDens = await Den.where({ placeId: place.id }).all()

  for (const [index, title] of titles.entries()) {
    const den = existingDens[index] || (await Den.create({ place }))
    await seedLocalizedTitle(den, title)
  }
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
