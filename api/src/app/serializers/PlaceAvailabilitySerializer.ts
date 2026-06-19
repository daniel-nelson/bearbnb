import { CalendarDate, ObjectSerializer } from '@rvoh/dream'

export type OccupiedRange = {
  startsOn: CalendarDate
  endsOn: CalendarDate
}

export type PlaceAvailability = {
  occupiedRanges: OccupiedRange[]
}

export const OccupiedRangeSerializer = (range: OccupiedRange) =>
  ObjectSerializer(range)
    .attribute('startsOn', { openapi: 'date' })
    .attribute('endsOn', { openapi: 'date' })

export const PlaceAvailabilitySerializer = (availability: PlaceAvailability) =>
  ObjectSerializer(availability).rendersMany('occupiedRanges', { serializer: OccupiedRangeSerializer })
