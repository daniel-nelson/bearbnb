import { ObjectSerializer } from '@rvoh/dream'

export type PlaceOccupiedRange = {
  startsOn: string
  endsOn: string
}

export type PlaceAvailability = {
  placeId: string
  occupiedRanges: PlaceOccupiedRange[]
}

const dateSchema = { type: 'string', format: 'date' } as const

export const PlaceOccupiedRangeSerializer = (occupiedRange: PlaceOccupiedRange) =>
  ObjectSerializer(occupiedRange)
    .attribute('startsOn', { openapi: dateSchema })
    .attribute('endsOn', { openapi: dateSchema })

export const PlaceAvailabilitySerializer = (availability: PlaceAvailability) =>
  ObjectSerializer(availability)
    .attribute('placeId', { openapi: 'string' })
    .rendersMany('occupiedRanges', { serializer: PlaceOccupiedRangeSerializer })
