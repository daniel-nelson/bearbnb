import { useEffect, useState, type FormEvent } from "react";
import { DateTime } from "luxon";
import { Link, useParams } from "react-router-dom";
import {
  getV1VisitorPlacesById,
  getV1VisitorPlacesByIdAvailability,
  getV1VisitorPlacesByPlaceIdReviews,
  postV1GuestBookings,
  postV1GuestReviews,
} from "../api/backend/generated";
import type {
  PlaceAvailability,
  PlaceForVisitors,
  PlaceOccupiedRange,
  ReviewVisitorSummary,
} from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { BookingCalendar } from "../components/BookingCalendar";
import { FavoriteToggle } from "../components/FavoriteToggle";
import { SiteHeader } from "../components/SiteHeader";
import { rangeOverlapsOccupiedNights } from "../lib/availability";
import { useAuth } from "../lib/authContext";

type BookingSubmitState = "idle" | "submitting" | "confirmed";
type ReviewSubmitState = "idle" | "submitting" | "confirmed";
type ReviewsState = "loading" | "loaded" | "failed";

type Room = PlaceForVisitors["rooms"][number];

export default function PlaceDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [place, setPlace] = useState<PlaceForVisitors | null>(null);
  const [availability, setAvailability] = useState<PlaceAvailability | null>(
    null,
  );
  const [status, setStatus] = useState("Loading place...");
  const [reviews, setReviews] = useState<ReviewVisitorSummary[]>([]);
  const [reviewsState, setReviewsState] = useState<ReviewsState>("loading");
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadPlace(placeId: string) {
      const { data, error } = await getV1VisitorPlacesById({
        path: { id: placeId },
      });

      if (!active) return;

      if (error || !data) {
        setStatus("This place is not available right now.");
        return;
      }

      setPlace(data);
      setStatus("");
    }

    async function loadAvailability(placeId: string) {
      const { data, error } = await getV1VisitorPlacesByIdAvailability({
        path: { id: placeId },
      });

      if (!active || error || !data) return;

      setAvailability(data);
    }

    async function loadReviews(placeId: string) {
      const { data, error } = await getV1VisitorPlacesByPlaceIdReviews({
        path: { placeId },
      });

      if (!active) return;

      if (error || !data) {
        setReviewsState("failed");
        return;
      }

      setReviews(data.results);
      setReviewsState("loaded");
    }

    void loadPlace(id);
    void loadAvailability(id);
    void loadReviews(id);

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to="/"
          >
            All places
          </Link>
        }
      />

      {status ? (
        <p
          className="mt-10 border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
          data-testid="place-detail-status"
        >
          {status}
        </p>
      ) : place ? (
        <section className="py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:py-14">
          <div className="min-w-0">
            <h1
              className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-normal text-[#111113] sm:text-6xl"
              data-testid="place-detail-title"
            >
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

            <ReviewsSection reviews={reviews} state={reviewsState} />
          </div>

          <aside className="mt-8 self-start border border-[#deded8] bg-white lg:sticky lg:top-6 lg:mt-0">
            <dl className="grid grid-cols-2 border-b border-[#deded8]">
              <div className="border-r border-[#deded8] p-4">
                <dt className="text-sm font-medium text-[#707069]">Sleeps</dt>
                <dd className="mt-2 text-2xl font-semibold">{place.sleeps}</dd>
              </div>
              <div className="p-4">
                <dt className="text-sm font-medium text-[#707069]">Rooms</dt>
                <dd className="mt-2 text-2xl font-semibold">
                  {place.rooms.length}
                </dd>
              </div>
              <div className="col-span-2 border-t border-[#deded8] p-4">
                <dt className="text-sm font-medium text-[#707069]">Style</dt>
                <dd className="mt-2 text-lg font-semibold">
                  {place.displayStyle}
                </dd>
              </div>
            </dl>

            {user ? (
              <BookingForm
                placeId={place.id}
                occupiedRanges={availability?.occupiedRanges ?? []}
                onBookingConfirmed={setConfirmedBookingId}
              />
            ) : (
              <div className="p-4">
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                  Booking
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#151516]">
                  Reserve this place
                </h2>
                <p className="mt-3 text-sm text-[#62625c]">
                  <Link
                    className="font-semibold text-[#18181a] underline"
                    to="/auth"
                  >
                    Sign in
                  </Link>{" "}
                  to request these dates.
                </p>
              </div>
            )}

            {user && confirmedBookingId && (
              <ReviewForm
                bookingId={confirmedBookingId}
                placeTitle={place.title}
                onReviewCreated={(review) => {
                  setReviews((current) => [review, ...current]);
                  setReviewsState("loaded");
                }}
              />
            )}

            {user && (
              <div className="border-t border-[#deded8] p-4">
                <FavoriteToggle
                  className="w-full justify-center"
                  place={place}
                  onChange={(next) =>
                    setPlace((current) =>
                      current ? { ...current, ...next } : current,
                    )
                  }
                />
              </div>
            )}
          </aside>
        </section>
      ) : null}
    </AppShell>
  );
}

function BookingForm({
  placeId,
  occupiedRanges,
  onBookingConfirmed,
}: {
  placeId: string;
  occupiedRanges: PlaceOccupiedRange[];
  onBookingConfirmed: (bookingId: string) => void;
}) {
  const [selectedStartsOn, setSelectedStartsOn] = useState("");
  const [selectedEndsOn, setSelectedEndsOn] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(
    () => DateTime.local().startOf("month").toISODate() ?? "",
  );
  const [submitState, setSubmitState] = useState<BookingSubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!selectedStartsOn || !selectedEndsOn) {
      setMessage("Choose available check-in and checkout dates.");
      return;
    }

    const checkIn = DateTime.fromISO(selectedStartsOn);
    const checkout = DateTime.fromISO(selectedEndsOn);
    const today = DateTime.local().startOf("day");

    if (!checkIn.isValid || !checkout.isValid) {
      setMessage("Choose valid check-in and checkout dates.");
      return;
    }

    if (checkIn < today) {
      setMessage("Check-in cannot be in the past.");
      return;
    }

    if (checkout <= checkIn) {
      setMessage("Checkout must be after check-in.");
      return;
    }

    if (
      rangeOverlapsOccupiedNights(selectedStartsOn, selectedEndsOn, occupiedRanges)
    ) {
      setMessage("Those dates are unavailable.");
      return;
    }

    setSubmitState("submitting");
    const { data, error, response } = await postV1GuestBookings({
      body: {
        placeId,
        startsOn: selectedStartsOn,
        endsOn: selectedEndsOn,
      },
    });

    if (error || !data) {
      setSubmitState("idle");
      setMessage(
        response?.status === 409
          ? "Those dates are unavailable."
          : "We could not book this place.",
      );
      return;
    }

    onBookingConfirmed(data.id);
    setSubmitState("confirmed");
    setMessage(`Booked ${data.startsOn} through ${data.endsOn}.`);
  }

  return (
    <form className="space-y-4 p-4" onSubmit={(event) => void submitBooking(event)}>
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
          Booking
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#151516]">
          Reserve this place
        </h2>
      </div>

      <BookingCalendar
        occupiedRanges={occupiedRanges}
        selectedEndsOn={selectedEndsOn}
        selectedStartsOn={selectedStartsOn}
        setBookingStatus={setMessage}
        setSelectedEndsOn={setSelectedEndsOn}
        setSelectedStartsOn={setSelectedStartsOn}
        setVisibleMonth={setVisibleMonth}
        visibleMonth={visibleMonth}
      />

      <button
        className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
        data-testid="booking-submit"
        disabled={
          submitState === "submitting" || !selectedStartsOn || !selectedEndsOn
        }
        type="submit"
      >
        {submitState === "submitting"
          ? "Booking..."
          : submitState === "confirmed"
            ? "Booked"
            : "Book place"}
      </button>

      {message && (
        <p
          className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]"
          data-testid="booking-message"
          role={submitState === "confirmed" ? "status" : "alert"}
        >
          {message}
        </p>
      )}
    </form>
  );
}

function ReviewForm({
  bookingId,
  placeTitle,
  onReviewCreated,
}: {
  bookingId: string;
  placeTitle: string;
  onReviewCreated: (review: ReviewVisitorSummary) => void;
}) {
  const [rating, setRating] = useState("");
  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<ReviewSubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const parsedRating = Number(rating);
    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      setMessage("Choose a rating from 1 to 5.");
      return;
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setMessage("Write a short review.");
      return;
    }

    setSubmitState("submitting");
    const { data, error, response } = await postV1GuestReviews({
      body: {
        bookingId,
        rating: parsedRating,
        body: trimmedBody,
      },
    });

    if (error || !data) {
      setSubmitState("idle");
      setMessage(
        response?.status === 409
          ? "This booking already has a review."
          : "We could not save this review.",
      );
      return;
    }

    onReviewCreated(data);
    setSubmitState("confirmed");
    setMessage(`Reviewed ${placeTitle}.`);
  }

  const hasSavedReview = submitState === "confirmed";

  return (
    <form
      className="space-y-4 border-t border-[#deded8] p-4"
      onSubmit={(event) => void submitReview(event)}
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
        <span className="text-sm font-medium text-[#4f4f4a]">Rating</span>
        <input
          className="mt-2 h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]"
          data-testid="review-rating"
          disabled={hasSavedReview}
          max="5"
          min="1"
          onChange={(event) => setRating(event.target.value)}
          type="number"
          value={rating}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[#4f4f4a]">Notes</span>
        <textarea
          className="mt-2 min-h-24 w-full resize-y border border-[#d9d9d2] bg-white px-3 py-2 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]"
          data-testid="review-body"
          disabled={hasSavedReview}
          onChange={(event) => setBody(event.target.value)}
          value={body}
        />
      </label>

      <button
        className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
        data-testid="review-submit"
        disabled={submitState === "submitting" || hasSavedReview}
        type="submit"
      >
        {submitState === "submitting"
          ? "Saving..."
          : hasSavedReview
            ? "Review saved"
            : "Save review"}
      </button>

      {message && (
        <p
          className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]"
          data-testid="review-message"
          role={hasSavedReview ? "status" : "alert"}
        >
          {message}
        </p>
      )}
    </form>
  );
}

function ReviewsSection({
  reviews,
  state,
}: {
  reviews: ReviewVisitorSummary[];
  state: ReviewsState;
}) {
  return (
    <section className="mt-10 border-t border-[#deded8] pt-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
          Reviews
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
          Guest notes
        </h2>
      </div>

      {state === "loading" ? (
        <p
          className="border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
          data-testid="reviews-status"
        >
          Loading reviews...
        </p>
      ) : state === "failed" ? (
        <p
          className="border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
          data-testid="reviews-status"
          role="alert"
        >
          Reviews are unavailable right now.
        </p>
      ) : reviews.length === 0 ? (
        <p
          className="border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
          data-testid="reviews-status"
        >
          No reviews yet.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((review) => (
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
      )}
    </section>
  );
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

function roomDetailLabels(room: Room): string[] {
  switch (room.type) {
    case "Kitchen":
      return room.appliances.map((appliance) => appliance.label);
    case "Bedroom":
      return room.bedTypes.map((bedType) => bedType.label);
    case "Bathroom":
      return [room.bathOrShowerStyle.label];
    case "Den":
    case "LivingRoom":
      return [];
    default: {
      const _never: never = room;
      throw new Error(`Unhandled room type: ${String(_never)}`);
    }
  }
}
