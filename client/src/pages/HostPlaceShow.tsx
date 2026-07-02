import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  deleteV1HostPlacesById,
  getV1Host,
  getV1HostPlacesById,
} from "../api/backend/generated";
import type { PlaceForHost } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

// Host Place detail. Resolves the current User's Host first (`GET /v1/host` answers
// 404 when the signed-in User is not a Host yet, which routes back to `/host/places`
// where item 3 owns onboarding), then loads the Place through the Host-specific show
// endpoint, which returns owner-management fields, editable localized text rows, and
// the Place's embedded Rooms.
type HostState = "loading" | "absent" | "present" | "failed";
type PlaceState = "loading" | "loaded" | "notFound" | "failed";

type Room = PlaceForHost["rooms"][number];
type LocalizedTextRow = PlaceForHost["localizedTexts"][number];

function styleLabel(style: PlaceForHost["style"]): string {
  const spaced = style.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// STI type values are PascalCase class names (e.g. "LivingRoom"); render them as
// human-readable labels ("Living room").
function roomTypeLabel(type: Room["type"]): string {
  const spaced = type.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function localeLabel(locale: LocalizedTextRow["locale"]): string {
  switch (locale) {
    case "en-US":
      return "English (en-US)";
    case "es-ES":
      return "Spanish (es-ES)";
    default: {
      const _never: never = locale;
      return String(_never);
    }
  }
}

export default function HostPlaceShow() {
  const { user, ready } = useAuth();
  const { id } = useParams();

  const [hostState, setHostState] = useState<HostState>("loading");
  const [placeState, setPlaceState] = useState<PlaceState>("loading");
  const [place, setPlace] = useState<PlaceForHost | null>(null);

  // Resolve the Host, then the Place. Inline async load keeps the first statement an
  // await (no synchronous setState inside an effect).
  useEffect(() => {
    if (!ready || !user || !id) return;

    async function load(placeId: string) {
      const { data, error, response } = await getV1Host();

      if (!data) {
        // A 404 is the expected "this User is not a Host yet" signal.
        setHostState(error && response?.status === 404 ? "absent" : "failed");
        return;
      }

      setHostState("present");
      setPlaceState("loading");

      const place = await getV1HostPlacesById({ path: { id: placeId } });

      if (place.data) {
        setPlace(place.data);
        setPlaceState("loaded");
        return;
      }

      setPlaceState(place.response?.status === 404 ? "notFound" : "failed");
    }

    void load(id);
  }, [ready, user, id]);

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to="/host/places"
          >
            Back to places
          </Link>
        }
      />

      <section className="py-8">
        {!ready ? (
          <StatusCard testId="host-place-status">Loading...</StatusCard>
        ) : !user ? (
          <StatusCard testId="host-place-status">
            <Link className="font-semibold text-[#18181a] underline" to="/auth">
              Sign in
            </Link>{" "}
            to manage this place.
          </StatusCard>
        ) : hostState === "loading" ? (
          <StatusCard testId="host-place-status">
            Loading your hosting profile...
          </StatusCard>
        ) : hostState === "failed" ? (
          <StatusCard testId="host-place-status" isError>
            We could not load your hosting profile right now.
          </StatusCard>
        ) : hostState === "absent" ? (
          // Item 3's index owns onboarding; send the not-yet-a-Host User there.
          <Navigate replace to="/host/places" />
        ) : placeState === "loading" ? (
          <StatusCard testId="host-place-status">Loading place...</StatusCard>
        ) : placeState === "notFound" ? (
          <div className="space-y-4">
            <StatusCard testId="host-place-status" isError>
              We could not find that place.
            </StatusCard>
            <BackToPlacesLink />
          </div>
        ) : placeState === "failed" || !place ? (
          <div className="space-y-4">
            <StatusCard testId="host-place-status" isError>
              We could not load this place right now.
            </StatusCard>
            <BackToPlacesLink />
          </div>
        ) : (
          <PlaceDetail place={place} />
        )}
      </section>
    </AppShell>
  );
}

function PlaceDetail({ place }: { place: PlaceForHost }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deletePlace() {
    setDeleting(true);
    setDeleteError("");

    const { error } = await deleteV1HostPlacesById({ path: { id: place.id } });

    if (error) {
      setDeleting(false);
      setDeleteError("We could not delete this place. Please try again.");
      return;
    }

    // Return to the Host Places index after a successful delete.
    navigate("/host/places");
  }

  return (
    <div className="space-y-8" data-testid="host-place-detail">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            Hosting
          </p>
          <h1
            className="mt-2 break-words text-3xl font-semibold tracking-normal text-[#111113]"
            data-testid="host-place-name"
          >
            {place.name}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Edit navigates to the full-page edit route. */}
          <Link
            className="inline-flex h-11 items-center border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            data-testid="host-place-edit"
            to={`/host/places/${place.id}/edit`}
          >
            Edit
          </Link>
          {/* Delete opens the shared confirmation dialog, which shows the Place name. */}
          <button
            className="inline-flex h-11 items-center border border-[#e0c8c8] bg-white px-5 text-sm font-semibold text-[#a4423a] transition hover:border-[#cf9a9a]"
            data-testid="host-place-delete"
            onClick={() => {
              setDeleteError("");
              setConfirmOpen(true);
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        body="Delete"
        busy={deleting}
        error={deleteError}
        heading="Delete place"
        itemName={place.name}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void deletePlace()}
        open={confirmOpen}
      />

      <dl className="grid grid-cols-2 border border-[#deded8] bg-white sm:grid-cols-3">
        <div className="border-b border-r border-[#deded8] p-4 sm:border-b-0">
          <dt className="text-sm font-medium text-[#707069]">Style</dt>
          <dd className="mt-2 text-lg font-semibold text-[#171719]">
            {styleLabel(place.style)}
          </dd>
        </div>
        <div className="border-b border-[#deded8] p-4 sm:border-b-0 sm:border-r">
          <dt className="text-sm font-medium text-[#707069]">Sleeps</dt>
          <dd className="mt-2 text-lg font-semibold text-[#171719]">
            {place.sleeps}
          </dd>
        </div>
        <div className="col-span-2 border-t border-[#deded8] p-4 sm:col-span-1 sm:border-t-0">
          <dt className="text-sm font-medium text-[#707069]">Rooms</dt>
          <dd className="mt-2 text-lg font-semibold text-[#171719]">
            {place.rooms.length}
          </dd>
        </div>
      </dl>

      <LocalizedTextSection rows={place.localizedTexts} />
      <RoomsSection placeId={place.id} rooms={place.rooms} />
    </div>
  );
}

function LocalizedTextSection({ rows }: { rows: LocalizedTextRow[] }) {
  return (
    <section className="border-t border-[#deded8] pt-8">
      <h2 className="text-2xl font-semibold tracking-normal text-[#111113]">
        Listing content
      </h2>

      {rows.length === 0 ? (
        <StatusCard testId="host-place-localized-empty">
          No listing content yet.
        </StatusCard>
      ) : (
        <ul className="mt-6 space-y-3" data-testid="host-place-localized-list">
          {rows.map((row) => (
            <li
              className="border border-[#deded8] bg-white p-4"
              data-testid="host-place-localized-row"
              key={row.id}
            >
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                {localeLabel(row.locale)}
              </p>
              <h3 className="mt-2 break-words text-lg font-semibold text-[#171719]">
                {row.title ?? "Untitled"}
              </h3>
              {row.markdown && (
                <p className="mt-2 whitespace-pre-line break-words text-sm text-[#4f4f4a]">
                  {row.markdown}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RoomsSection({ placeId, rooms }: { placeId: string; rooms: Room[] }) {
  return (
    <section className="border-t border-[#deded8] pt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-normal text-[#111113]">
          Rooms
        </h2>
        <NewRoomLink placeId={placeId} />
      </div>

      {rooms.length === 0 ? (
        <div
          className="border border-[#deded8] bg-white px-6 py-10 text-center"
          data-testid="host-rooms-empty"
        >
          <h3 className="text-xl font-semibold text-[#171719]">No rooms yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#62625c]">
            Add rooms so guests can see what this place offers.
          </p>
          <div className="mt-6">
            <NewRoomLink placeId={placeId} />
          </div>
        </div>
      ) : (
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="host-rooms-list"
        >
          {rooms.map((room) => (
            <li
              className="border border-[#deded8] bg-white transition hover:border-[#b9b9b1]"
              key={room.id}
            >
              <Link
                className="block p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1d1d1f]"
                data-testid="host-room-link"
                to={`/host/places/${placeId}/rooms/${room.id}`}
              >
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                  {roomTypeLabel(room.type)}
                </p>
                {room.position !== null && (
                  <p className="mt-2 text-base font-semibold text-[#171719]">
                    Room {room.position}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NewRoomLink({ placeId }: { placeId: string }) {
  return (
    <Link
      className="inline-flex h-11 items-center bg-[#1d1d1f] px-5 text-sm font-semibold text-white transition hover:bg-[#333336]"
      data-testid="host-room-new"
      to={`/host/places/${placeId}/rooms/new`}
    >
      New room
    </Link>
  );
}

function BackToPlacesLink() {
  return (
    <Link
      className="inline-flex h-11 items-center border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
      data-testid="host-place-back"
      to="/host/places"
    >
      Back to places
    </Link>
  );
}

function StatusCard({
  children,
  testId,
  isError,
}: {
  children: React.ReactNode;
  testId: string;
  isError?: boolean;
}) {
  return (
    <p
      className="border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
      data-testid={testId}
      role={isError ? "alert" : undefined}
    >
      {children}
    </p>
  );
}
