import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  deleteV1HostPlacesByPlaceIdRoomsById,
  getV1Host,
  getV1HostPlacesByPlaceIdRoomsById,
} from "../api/backend/generated";
import type { GetV1HostPlacesByPlaceIdRoomsByIdResponse } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

// Host Room detail, scoped to a Place. Resolves the current User's Host first (`GET
// /v1/host` answers 404 when the signed-in User is not a Host yet, which routes back to
// `/host/places` where item 3 owns onboarding), then loads the Room through the
// Host-specific show endpoint, which returns owner-management fields, the type-specific
// STI fields, and editable localized text rows. Exposes edit and delete actions; delete
// uses the shared confirmation dialog and returns to the Host Place show page.
type HostState = "loading" | "absent" | "present" | "failed";
type RoomState = "loading" | "loaded" | "notFound" | "failed";

type RoomForHost = GetV1HostPlacesByPlaceIdRoomsByIdResponse;
type LocalizedTextRow = RoomForHost["localizedTexts"][number];

// STI type values are PascalCase class names (e.g. "LivingRoom"); render them as
// human-readable labels ("Living room").
function roomTypeLabel(type: RoomForHost["type"]): string {
  const spaced = type.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
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

// The en-US title is the fallback name shown in the delete confirmation.
function roomTitle(room: RoomForHost): string {
  const en = room.localizedTexts.find((row) => row.locale === "en-US");
  return en?.title?.trim() || roomTypeLabel(room.type);
}

// Type-specific detail rows, driven by the STI discriminator. Den/LivingRoom have no
// type-specific fields.
function typeSpecificDetails(room: RoomForHost): { label: string; value: string }[] {
  switch (room.type) {
    case "Bathroom":
      return [
        {
          label: "Bath or shower",
          value: room.bathOrShowerStyle
            ? humanize(room.bathOrShowerStyle)
            : "Not set",
        },
      ];
    case "Bedroom":
      return [
        {
          label: "Bed types",
          value: room.bedTypes.length
            ? room.bedTypes.map(humanize).join(", ")
            : "None",
        },
      ];
    case "Kitchen":
      return [
        {
          label: "Appliances",
          value: room.appliances.length
            ? room.appliances.map(humanize).join(", ")
            : "None",
        },
      ];
    case "Den":
    case "LivingRoom":
      return [];
    default: {
      const _never: never = room;
      throw new Error(`Unhandled room type: ${String(_never)}`);
    }
  }
}

export default function HostRoomShow() {
  const { user, ready } = useAuth();
  const { placeId, id } = useParams();

  const [hostState, setHostState] = useState<HostState>("loading");
  const [roomState, setRoomState] = useState<RoomState>("loading");
  const [room, setRoom] = useState<RoomForHost | null>(null);

  // Resolve the Host, then the Room. Inline async load keeps the first statement an
  // await (no synchronous setState inside an effect).
  useEffect(() => {
    if (!ready || !user || !placeId || !id) return;

    async function load(pId: string, rId: string) {
      const { data, error, response } = await getV1Host();

      if (!data) {
        // A 404 is the expected "this User is not a Host yet" signal.
        setHostState(error && response?.status === 404 ? "absent" : "failed");
        return;
      }

      setHostState("present");
      setRoomState("loading");

      const result = await getV1HostPlacesByPlaceIdRoomsById({
        path: { placeId: pId, id: rId },
      });

      if (result.data) {
        setRoom(result.data);
        setRoomState("loaded");
        return;
      }

      setRoomState(result.response?.status === 404 ? "notFound" : "failed");
    }

    void load(placeId, id);
  }, [ready, user, placeId, id]);

  const backTo = placeId ? `/host/places/${placeId}` : "/host/places";

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to={backTo}
          >
            Back to place
          </Link>
        }
      />

      <section className="py-8">
        {!ready ? (
          <StatusCard testId="host-room-status">Loading...</StatusCard>
        ) : !user ? (
          <StatusCard testId="host-room-status">
            <Link className="font-semibold text-[#18181a] underline" to="/auth">
              Sign in
            </Link>{" "}
            to manage this room.
          </StatusCard>
        ) : hostState === "loading" ? (
          <StatusCard testId="host-room-status">
            Loading your hosting profile...
          </StatusCard>
        ) : hostState === "failed" ? (
          <StatusCard testId="host-room-status" isError>
            We could not load your hosting profile right now.
          </StatusCard>
        ) : hostState === "absent" ? (
          // Item 3's index owns onboarding; send the not-yet-a-Host User there.
          <Navigate replace to="/host/places" />
        ) : roomState === "loading" ? (
          <StatusCard testId="host-room-status">Loading room...</StatusCard>
        ) : roomState === "notFound" ? (
          <div className="space-y-4">
            <StatusCard testId="host-room-status" isError>
              We could not find that room.
            </StatusCard>
            <BackToPlaceLink to={backTo} />
          </div>
        ) : roomState === "failed" || !room ? (
          <div className="space-y-4">
            <StatusCard testId="host-room-status" isError>
              We could not load this room right now.
            </StatusCard>
            <BackToPlaceLink to={backTo} />
          </div>
        ) : (
          <RoomDetail placeId={placeId ?? ""} room={room} />
        )}
      </section>
    </AppShell>
  );
}

function RoomDetail({ placeId, room }: { placeId: string; room: RoomForHost }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deleteRoom() {
    setDeleting(true);
    setDeleteError("");

    const { error } = await deleteV1HostPlacesByPlaceIdRoomsById({
      path: { placeId, id: room.id },
    });

    if (error) {
      setDeleting(false);
      setDeleteError("We could not delete this room. Please try again.");
      return;
    }

    // Return to the Host Place show page after a successful delete.
    navigate(`/host/places/${placeId}`);
  }

  const details = typeSpecificDetails(room);

  return (
    <div className="space-y-8" data-testid="host-room-detail">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            {roomTypeLabel(room.type)}
          </p>
          <h1
            className="mt-2 break-words text-3xl font-semibold tracking-normal text-[#111113]"
            data-testid="host-room-title"
          >
            {roomTitle(room)}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Edit navigates to the full-page edit route. */}
          <Link
            className="inline-flex h-11 items-center border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            data-testid="host-room-edit"
            to={`/host/places/${placeId}/rooms/${room.id}/edit`}
          >
            Edit
          </Link>
          {/* Delete opens the shared confirmation dialog, which shows the Room title. */}
          <button
            className="inline-flex h-11 items-center border border-[#e0c8c8] bg-white px-5 text-sm font-semibold text-[#a4423a] transition hover:border-[#cf9a9a]"
            data-testid="host-room-delete"
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
        heading="Delete room"
        itemName={roomTitle(room)}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void deleteRoom()}
        open={confirmOpen}
      />

      <dl className="grid grid-cols-2 border border-[#deded8] bg-white">
        <div className="border-r border-[#deded8] p-4">
          <dt className="text-sm font-medium text-[#707069]">Type</dt>
          <dd className="mt-2 text-lg font-semibold text-[#171719]">
            {roomTypeLabel(room.type)}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-sm font-medium text-[#707069]">Position</dt>
          <dd className="mt-2 text-lg font-semibold text-[#171719]">
            {room.position ?? "Not set"}
          </dd>
        </div>
        {details.map((detail) => (
          <div
            className="col-span-2 border-t border-[#deded8] p-4"
            key={detail.label}
          >
            <dt className="text-sm font-medium text-[#707069]">
              {detail.label}
            </dt>
            <dd className="mt-2 text-lg font-semibold text-[#171719]">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>

      <LocalizedTextSection rows={room.localizedTexts} />
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
        <StatusCard testId="host-room-localized-empty">
          No listing content yet.
        </StatusCard>
      ) : (
        <ul className="mt-6 space-y-3" data-testid="host-room-localized-list">
          {rows.map((row) => (
            <li
              className="border border-[#deded8] bg-white p-4"
              data-testid="host-room-localized-row"
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

function BackToPlaceLink({ to }: { to: string }) {
  return (
    <Link
      className="inline-flex h-11 items-center border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
      data-testid="host-room-back"
      to={to}
    >
      Back to place
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
