import { useEffect, useState, type FormEvent } from "react";
import { DateTime } from "luxon";
import { Link, useParams } from "react-router-dom";
import {
  getV1VisitorPlacesById,
  postV1GuestBookings,
} from "../api/backend/generated";
import type { PlaceForVisitors } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { FavoriteToggle } from "../components/FavoriteToggle";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

type BookingSubmitState = "idle" | "submitting" | "confirmed";

function dateInputValue(date: DateTime) {
  return date.toISODate() ?? "";
}

type Room = PlaceForVisitors["rooms"][number];

export default function PlaceDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [place, setPlace] = useState<PlaceForVisitors | null>(null);
  const [status, setStatus] = useState("Loading place...");

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

    void loadPlace(id);

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
              <BookingForm placeId={place.id} />
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

function BookingForm({ placeId }: { placeId: string }) {
  const defaultCheckIn = DateTime.local().plus({ days: 1 }).startOf("day");
  const [startsOn, setStartsOn] = useState(dateInputValue(defaultCheckIn));
  const [endsOn, setEndsOn] = useState(
    dateInputValue(defaultCheckIn.plus({ days: 2 })),
  );
  const [submitState, setSubmitState] = useState<BookingSubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const checkIn = DateTime.fromISO(startsOn);
    const checkout = DateTime.fromISO(endsOn);
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

    setSubmitState("submitting");
    const { data, error, response } = await postV1GuestBookings({
      body: {
        placeId,
        startsOn: dateInputValue(checkIn),
        endsOn: dateInputValue(checkout),
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

      <label className="block">
        <span className="text-sm font-medium text-[#4f4f4a]">Check-in</span>
        <input
          className="mt-2 h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]"
          data-testid="booking-starts-on"
          name="startsOn"
          onChange={(event) => setStartsOn(event.target.value)}
          required
          type="date"
          value={startsOn}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[#4f4f4a]">Checkout</span>
        <input
          className="mt-2 h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]"
          data-testid="booking-ends-on"
          name="endsOn"
          onChange={(event) => setEndsOn(event.target.value)}
          required
          type="date"
          value={endsOn}
        />
      </label>

      <button
        className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
        data-testid="booking-submit"
        disabled={submitState === "submitting"}
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
