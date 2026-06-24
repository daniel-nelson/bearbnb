import type { PlaceOccupiedRange } from "../api/backend/generated";

// Our backend models a night as occupied with checkout-EXCLUSIVE ranges: a date is
// occupied when `startsOn <= date < endsOn`. The checkout day (`endsOn`) is therefore
// bookable for same-day turnover. Inputs are ISO calendar-date strings (YYYY-MM-DD),
// so lexicographic string comparison matches chronological order.
export function isOccupiedNight(
  date: string,
  occupiedRanges: PlaceOccupiedRange[],
) {
  return occupiedRanges.some(
    (range) => date >= range.startsOn && date < range.endsOn,
  );
}

// A selected booking [startsOn, endsOn) overlaps an occupied [oStartsOn, oEndsOn)
// night range using the same checkout-exclusive rule.
export function rangeOverlapsOccupiedNights(
  startsOn: string,
  endsOn: string,
  occupiedRanges: PlaceOccupiedRange[],
) {
  return occupiedRanges.some(
    (range) => startsOn < range.endsOn && endsOn > range.startsOn,
  );
}
