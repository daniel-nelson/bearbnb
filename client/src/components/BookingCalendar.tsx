import { DateTime } from "luxon";
import type { PlaceOccupiedRange } from "../api/backend/generated";
import {
  isOccupiedNight,
  rangeOverlapsOccupiedNights,
} from "../lib/availability";

function isoDate(date: DateTime) {
  const value = date.toISODate();
  if (!value) throw new Error("Expected a valid calendar date");
  return value;
}

function calendarDays(month: DateTime) {
  const firstDay = month.startOf("month");
  const lastDay = month.endOf("month");
  const gridStart = firstDay.minus({ days: firstDay.weekday % 7 });
  const gridEnd = lastDay.plus({ days: 6 - (lastDay.weekday % 7) });
  const days: DateTime[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = cursor.plus({ days: 1 });
  }

  return days;
}

export function BookingCalendar({
  occupiedRanges,
  selectedEndsOn,
  selectedStartsOn,
  setBookingStatus,
  setSelectedEndsOn,
  setSelectedStartsOn,
  setVisibleMonth,
  visibleMonth,
}: {
  occupiedRanges: PlaceOccupiedRange[];
  selectedEndsOn: string;
  selectedStartsOn: string;
  setBookingStatus: (status: string) => void;
  setSelectedEndsOn: (date: string) => void;
  setSelectedStartsOn: (date: string) => void;
  setVisibleMonth: (date: string) => void;
  visibleMonth: string;
}) {
  const month = DateTime.fromISO(visibleMonth, { zone: "utc" }).startOf("month");
  const days = calendarDays(month);
  const today = isoDate(DateTime.local().startOf("day"));
  const selectedLabel = selectedStartsOn
    ? selectedEndsOn
      ? `${selectedStartsOn} to ${selectedEndsOn}`
      : `${selectedStartsOn} to ...`
    : "No dates selected";

  function selectDate(date: string) {
    if (isOccupiedNight(date, occupiedRanges)) return;

    if (!selectedStartsOn || selectedEndsOn || date < selectedStartsOn) {
      setSelectedStartsOn(date);
      setSelectedEndsOn("");
      setBookingStatus("");
      return;
    }

    if (rangeOverlapsOccupiedNights(selectedStartsOn, date, occupiedRanges)) {
      setBookingStatus("Those dates are unavailable.");
      return;
    }

    setSelectedEndsOn(date);
    setBookingStatus("");
  }

  return (
    <div className="border border-[#deded8]">
      <div className="flex min-h-12 items-center justify-between border-b border-[#deded8] px-3">
        <button
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center border border-[#d9d9d2] text-lg leading-none text-[#4f4f4a] transition hover:border-[#b9b9b1]"
          onClick={() => setVisibleMonth(isoDate(month.minus({ months: 1 })))}
          type="button"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-[#252523]">
          {month.toLocaleString({ month: "long", year: "numeric" })}
        </p>
        <button
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center border border-[#d9d9d2] text-lg leading-none text-[#4f4f4a] transition hover:border-[#b9b9b1]"
          onClick={() => setVisibleMonth(isoDate(month.plus({ months: 1 })))}
          type="button"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-[#deded8] bg-[#fafaf8] text-center text-[11px] font-semibold uppercase text-[#707069]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div className="py-2" key={day}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const date = isoDate(day);
          const isBooked = isOccupiedNight(date, occupiedRanges);
          const isOutsideMonth = day.month !== month.month;
          const isSelected =
            date === selectedStartsOn ||
            date === selectedEndsOn ||
            Boolean(
              selectedStartsOn &&
                selectedEndsOn &&
                date > selectedStartsOn &&
                date < selectedEndsOn,
            );
          const isPast = today ? date < today : false;

          return (
            <button
              aria-label={day.toLocaleString(DateTime.DATE_FULL)}
              aria-pressed={isSelected}
              className={[
                "aspect-square border-b border-r border-[#edede7] text-sm font-medium transition last:border-r-0 disabled:cursor-not-allowed",
                isOutsideMonth ? "text-[#b6b6ae]" : "text-[#272724]",
                isBooked
                  ? "bg-[#d7d7d0] text-[#77776f] line-through"
                  : "bg-white hover:bg-[#f3f3ee]",
                isSelected ? "bg-[#1d1d1f] text-white hover:bg-[#1d1d1f]" : "",
                isPast && !isSelected ? "text-[#a5a59e]" : "",
              ].join(" ")}
              data-testid={`availability-day-${date}`}
              disabled={isBooked || isPast}
              key={date}
              onClick={() => selectDate(date)}
              type="button"
            >
              {day.day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#4f4f4a]">
        <span data-testid="availability-selection">{selectedLabel}</span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 bg-[#d7d7d0]" aria-hidden="true" />
          Booked
        </span>
      </div>
    </div>
  );
}
