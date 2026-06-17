"use client";

import Link from "next/link";
import Image from "next/image";
import { DateTime } from "luxon";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type LabeledValue = {
  value: string;
  label: string;
};

type Room = {
  id: string;
  type: string;
  displayType: string;
  title: string;
  appliances?: LabeledValue[];
  bedTypes?: LabeledValue[];
  bathOrShowerStyle?: LabeledValue;
};

type Review = {
  id: string;
  rating: number;
  body: string;
};

type BookedRange = {
  startsOn: string;
  endsOn: string;
};

type PlaceDetail = {
  id: string;
  title: string;
  style: string;
  displayStyle: string;
  sleeps: number;
  rooms: Room[];
  reviews: Review[];
  bookedRanges: BookedRange[];
};

type BookingResponse = {
  id: string;
};

export default function PlaceDetailPage() {
  const params = useParams<{ id: string }>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [status, setStatus] = useState("Loading place...");
  const [confirmedBookingId, setConfirmedBookingId] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [selectedStartsOn, setSelectedStartsOn] = useState("");
  const [selectedEndsOn, setSelectedEndsOn] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() =>
    isoDate(DateTime.local().startOf("month")),
  );
  const [reviewStatus, setReviewStatus] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const hasSavedReview = reviewStatus.startsWith("Reviewed ");

  useEffect(() => {
    async function loadPlace() {
      const response = await fetch(`/api/guest/places/${params.id}`, {
        headers: {
          "accept-language": "en-US",
        },
      });

      if (!response.ok) {
        setStatus("This place is not available right now.");
        return;
      }

      const body = (await response.json()) as PlaceDetail;
      setPlace(body);
      setStatus("");
    }

    void loadPlace();
  }, [params.id]);

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!place) return;

    if (!selectedStartsOn || !selectedEndsOn) {
      setBookingStatus("Choose available start and end dates.");
      return;
    }

    if (rangeIncludesBookedDate(selectedStartsOn, selectedEndsOn, place.bookedRanges)) {
      setBookingStatus("Choose dates that do not include a booked day.");
      return;
    }

    setIsBooking(true);
    setBookingStatus("");
    setConfirmedBookingId("");
    setReviewStatus("");

    try {
      const response = await fetch("/api/guest/bookings", {
        body: JSON.stringify({
          placeId: place.id,
          startsOn: selectedStartsOn,
          endsOn: selectedEndsOn,
        }),
        cache: "no-store",
        credentials: "include",
        headers: {
          "accept-language": "en-US",
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (response.ok) {
        const booking = (await response.json()) as BookingResponse;
        setConfirmedBookingId(booking.id);
        setBookingStatus(`Booked ${place.title}.`);
        setPlace({
          ...place,
          bookedRanges: [
            ...place.bookedRanges,
            { startsOn: selectedStartsOn, endsOn: selectedEndsOn },
          ],
        });
      } else if (response.status === 401) {
        setBookingStatus("Sign in before booking this place.");
      } else if (response.status === 400) {
        setBookingStatus("Those dates are not available.");
      } else {
        setBookingStatus("We could not book this place.");
      }
    } finally {
      setIsBooking(false);
    }
  }

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!place || !confirmedBookingId) return;

    const formData = new FormData(event.currentTarget);
    const rating = Number(formData.get("rating") ?? "");
    const body = String(formData.get("review-body") ?? "");

    setIsReviewing(true);
    setReviewStatus("");

    try {
      const response = await fetch("/api/guest/reviews", {
        body: JSON.stringify({
          bookingId: confirmedBookingId,
          rating,
          body,
        }),
        cache: "no-store",
        credentials: "include",
        headers: {
          "accept-language": "en-US",
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (response.ok) {
        setReviewStatus(`Reviewed ${place.title}.`);
      } else if (response.status === 401) {
        setReviewStatus("Sign in before reviewing this place.");
      } else {
        setReviewStatus("We could not save this review.");
      }
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#1d1d1f]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#deded8] pb-5">
          <Link
            className="-mx-2 flex min-h-11 items-center gap-2 px-2 text-lg font-semibold tracking-normal"
            href="/"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="h-9 w-9"
              height={36}
              src="/bearbnb-logo.svg"
              width={36}
            />
            <span>BearBnB</span>
          </Link>
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            href="/"
          >
            All places
          </Link>
        </header>

        {status ? (
          <p className="mt-10 border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]">
            {status}
          </p>
        ) : place ? (
          <>
            <section className="py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:py-14">
              <div className="min-w-0">
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-normal text-[#111113] sm:text-6xl">
                  {place.title}
                </h1>

                {place.rooms.length > 0 && (
                  <section className="mt-10 border-t border-[#deded8] pt-8">
                    <div className="mb-6">
                      <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
                        Rooms
                      </h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {place.rooms.map((room) => (
                        <article
                          className="border border-[#deded8] bg-white p-4"
                          key={room.id}
                        >
                          <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                            {room.displayType}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[#171719]">
                            {room.title}
                          </h3>
                          <RoomDetails room={room} />
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {place.reviews.length > 0 && (
                  <section className="mt-10 border-t border-[#deded8] pt-8">
                    <div className="mb-6">
                      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
                        Reviews
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
                        Guest notes
                      </h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {place.reviews.map((review) => (
                        <article
                          className="border border-[#deded8] bg-white p-4"
                          key={review.id}
                        >
                          <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                            {review.rating} out of 5
                          </p>
                          <p className="mt-3 text-base leading-7 text-[#2f2f2c]">
                            {review.body}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <aside className="mt-8 self-start border border-[#deded8] bg-white lg:sticky lg:top-6 lg:mt-0">
                <dl className="grid grid-cols-2 border-b border-[#deded8]">
                  <div className="border-r border-[#deded8] p-4">
                    <dt className="text-sm font-medium text-[#707069]">
                      Sleeps
                    </dt>
                    <dd className="mt-2 text-2xl font-semibold">
                      {place.sleeps}
                    </dd>
                  </div>
                  <div className="p-4">
                    <dt className="text-sm font-medium text-[#707069]">
                      Rooms
                    </dt>
                    <dd className="mt-2 text-2xl font-semibold">
                      {place.rooms.length}
                    </dd>
                  </div>
                  <div className="col-span-2 border-t border-[#deded8] p-4">
                    <dt className="text-sm font-medium text-[#707069]">
                      Style
                    </dt>
                    <dd className="mt-2 text-lg font-semibold">
                      {place.displayStyle}
                    </dd>
                  </div>
                </dl>

                <form className="space-y-4 p-4" onSubmit={handleBooking}>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                      Booking
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#151516]">
                      Reserve this place
                    </h2>
                  </div>
                  <BookingCalendar
                    bookedRanges={place.bookedRanges}
                    selectedEndsOn={selectedEndsOn}
                    selectedStartsOn={selectedStartsOn}
                    setBookingStatus={setBookingStatus}
                    setSelectedEndsOn={setSelectedEndsOn}
                    setSelectedStartsOn={setSelectedStartsOn}
                    setVisibleMonth={setVisibleMonth}
                    visibleMonth={visibleMonth}
                  />
                  <button
                    className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
                    disabled={isBooking || !selectedStartsOn || !selectedEndsOn}
                    type="submit"
                  >
                    {isBooking ? "Booking..." : "Book place"}
                  </button>
                  {bookingStatus && (
                    <p className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]">
                      {bookingStatus}
                    </p>
                  )}
                </form>

                {confirmedBookingId && (
                  <form
                    className="space-y-4 border-t border-[#deded8] p-4"
                    onSubmit={handleReview}
                  >
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                        Review
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#151516]">
                        Review this place
                      </h2>
                    </div>
                    <label className="block">
                      <span className="text-sm font-medium text-[#4f4f4a]">
                        Rating
                      </span>
                      <input
                        className="mt-2 h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]"
                        max="5"
                        min="1"
                        name="rating"
                        required
                        type="number"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-[#4f4f4a]">
                        Notes
                      </span>
                      <textarea
                        className="mt-2 min-h-24 w-full resize-y border border-[#d9d9d2] bg-white px-3 py-2 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]"
                        name="review-body"
                        required
                      />
                    </label>
                    <button
                      className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
                      disabled={isReviewing || hasSavedReview}
                      type="submit"
                    >
                      {isReviewing
                        ? "Saving..."
                        : hasSavedReview
                          ? "Review saved"
                          : "Save review"}
                    </button>
                    {reviewStatus && (
                      <p className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]">
                        {reviewStatus}
                      </p>
                    )}
                  </form>
                )}
              </aside>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function BookingCalendar({
  bookedRanges,
  selectedEndsOn,
  selectedStartsOn,
  setBookingStatus,
  setSelectedEndsOn,
  setSelectedStartsOn,
  setVisibleMonth,
  visibleMonth,
}: {
  bookedRanges: BookedRange[];
  selectedEndsOn: string;
  selectedStartsOn: string;
  setBookingStatus: (status: string) => void;
  setSelectedEndsOn: (date: string) => void;
  setSelectedStartsOn: (date: string) => void;
  setVisibleMonth: (date: string) => void;
  visibleMonth: string;
}) {
  const month = DateTime.fromISO(visibleMonth, { zone: "utc" }).startOf("month");
  const bookedDates = bookedDateSet(bookedRanges);
  const days = calendarDays(month);
  const today = isoDate(DateTime.local().startOf("day"));
  const selectedLabel = selectedStartsOn
    ? selectedEndsOn
      ? `${selectedStartsOn} to ${selectedEndsOn}`
      : `${selectedStartsOn} to ...`
    : "No dates selected";

  function selectDate(date: string) {
    if (bookedDates.has(date)) return;

    if (!selectedStartsOn || selectedEndsOn || date < selectedStartsOn) {
      setSelectedStartsOn(date);
      setSelectedEndsOn("");
      setBookingStatus("");
      return;
    }

    if (rangeIncludesBookedDate(selectedStartsOn, date, bookedRanges)) {
      setBookingStatus("Choose dates that do not include a booked day.");
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
          const isBooked = bookedDates.has(date);
          const isOutsideMonth = day.month !== month.month;
          const isSelected =
            date === selectedStartsOn ||
            date === selectedEndsOn ||
            Boolean(selectedStartsOn && selectedEndsOn && date > selectedStartsOn && date < selectedEndsOn);
          const isPast = today ? date < today : false;

          return (
            <button
              aria-label={day.toLocaleString(DateTime.DATE_FULL)}
              aria-pressed={isSelected}
              className={[
                "aspect-square border-b border-r border-[#edede7] text-sm font-medium transition last:border-r-0 disabled:cursor-not-allowed",
                isOutsideMonth ? "text-[#b6b6ae]" : "text-[#272724]",
                isBooked ? "bg-[#d7d7d0] text-[#77776f] line-through" : "bg-white hover:bg-[#f3f3ee]",
                isSelected ? "bg-[#1d1d1f] text-white hover:bg-[#1d1d1f]" : "",
                isPast && !isSelected ? "text-[#a5a59e]" : "",
              ].join(" ")}
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
        <span>{selectedLabel}</span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 bg-[#d7d7d0]" aria-hidden="true" />
          Booked
        </span>
      </div>
    </div>
  );
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

function isoDate(date: DateTime) {
  const value = date.toISODate();
  if (!value) throw new Error("Expected a valid calendar date");
  return value;
}

function bookedDateSet(bookedRanges: BookedRange[]) {
  const dates = new Set<string>();

  for (const bookedRange of bookedRanges) {
    let cursor = DateTime.fromISO(bookedRange.startsOn, { zone: "utc" });
    const end = DateTime.fromISO(bookedRange.endsOn, { zone: "utc" });

    while (cursor <= end) {
      dates.add(isoDate(cursor));
      cursor = cursor.plus({ days: 1 });
    }
  }

  return dates;
}

function rangeIncludesBookedDate(startsOn: string, endsOn: string, bookedRanges: BookedRange[]) {
  const bookedDates = bookedDateSet(bookedRanges);
  let cursor = DateTime.fromISO(startsOn, { zone: "utc" });
  const end = DateTime.fromISO(endsOn, { zone: "utc" });

  while (cursor <= end) {
    if (bookedDates.has(isoDate(cursor))) return true;
    cursor = cursor.plus({ days: 1 });
  }

  return false;
}

function RoomDetails({ room }: { room: Room }) {
  const labels = roomDetailLabels(room);

  if (!labels.length) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {labels.map((label, index) => (
        <li
          className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]"
          key={`${label}-${index}`}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

function roomDetailLabels(room: Room) {
  if (room.appliances?.length) {
    return room.appliances.map((appliance) => appliance.label);
  }

  if (room.bedTypes?.length) {
    return room.bedTypes.map((bedType) => bedType.label);
  }

  if (room.bathOrShowerStyle) {
    return [room.bathOrShowerStyle.label];
  }

  return [];
}
