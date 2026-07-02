import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  getV1Host,
  getV1HostPlacesByPlaceIdRoomsById,
  patchV1HostPlacesByPlaceIdRoomsById,
} from "../api/backend/generated";
import type {
  GetV1HostPlacesByPlaceIdRoomsByIdResponse,
  PatchV1HostPlacesByPlaceIdRoomsByIdData,
} from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

// Full-page Room edit route, scoped to a Place. Resolves the current User's Host first
// (`GET /v1/host` answers 404 when the signed-in User is not a Host yet, which routes
// back to `/host/places` where item 3 owns onboarding), loads the Room through the
// Host-specific show endpoint to populate management fields and localized rows, then
// saves everything — including localized-text add/remove — through the nested owner Room
// update endpoint in a single request. The Room type is FIXED after creation: it is
// shown read-only and never sent. `en-US` is the required fallback locale and cannot be
// removed. Uses the same dynamic type-specific form pattern as create.
type HostState = "loading" | "absent" | "present" | "failed";
type RoomState = "loading" | "loaded" | "notFound" | "failed";
type SubmitState = "idle" | "submitting";

type RoomForHost = GetV1HostPlacesByPlaceIdRoomsByIdResponse;
type RoomType = RoomForHost["type"];
type RoomUpdateBody = NonNullable<
  PatchV1HostPlacesByPlaceIdRoomsByIdData["body"]
>;
type BathOrShowerStyle = NonNullable<RoomUpdateBody["bathOrShowerStyle"]>;
type BedType = NonNullable<RoomUpdateBody["bedTypes"]>[number];
type Appliance = NonNullable<RoomUpdateBody["appliances"]>[number];
type LocalizedTextPayload = NonNullable<
  RoomUpdateBody["localizedTexts"]
>[number];

// Typed against the SDK unions so a backend enum change surfaces here at build time. The
// generated client exposes these enums only as TS unions on the body type (no runtime
// values array), matching the hand-listed pattern used elsewhere.
const BATH_OR_SHOWER_STYLES: readonly BathOrShowerStyle[] = [
  "bath",
  "bath_and_shower",
  "none",
  "shower",
];
const BED_TYPES: readonly BedType[] = [
  "bunk",
  "cot",
  "king",
  "queen",
  "sofabed",
  "twin",
];
const APPLIANCES: readonly Appliance[] = [
  "dishwasher",
  "microwave",
  "oven",
  "stove",
];

function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// STI type values are PascalCase class names (e.g. "LivingRoom"); render them as
// human-readable labels ("Living room").
function roomTypeLabel(type: RoomType): string {
  const spaced = type.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export default function HostRoomEdit() {
  const { user, ready } = useAuth();
  const { placeId, id } = useParams();
  const navigate = useNavigate();

  const [hostState, setHostState] = useState<HostState>("loading");
  const [roomState, setRoomState] = useState<RoomState>("loading");

  // Type is fixed after creation; it is populated from the loaded Room and shown
  // read-only. `null` until the Room loads.
  const [type, setType] = useState<RoomType | null>(null);
  const [position, setPosition] = useState("");
  const [bathOrShowerStyle, setBathOrShowerStyle] =
    useState<BathOrShowerStyle>("none");
  const [bedTypes, setBedTypes] = useState<readonly BedType[]>([]);
  const [appliances, setAppliances] = useState<readonly Appliance[]>([]);
  const [enTitle, setEnTitle] = useState("");
  const [enDescription, setEnDescription] = useState("");
  const [addSpanish, setAddSpanish] = useState(false);
  const [esTitle, setEsTitle] = useState("");
  const [esDescription, setEsDescription] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  // Resolve the Host, then load the Room and populate the form. Inline async load keeps
  // the first statement an await (no synchronous setState inside an effect).
  useEffect(() => {
    if (!ready || !user || !placeId || !id) return;

    async function load(pId: string, rId: string) {
      const { data, error: apiError, response } = await getV1Host();

      if (!data) {
        setHostState(apiError && response?.status === 404 ? "absent" : "failed");
        return;
      }

      setHostState("present");
      setRoomState("loading");

      const result = await getV1HostPlacesByPlaceIdRoomsById({
        path: { placeId: pId, id: rId },
      });

      if (!result.data) {
        setRoomState(
          result.response?.status === 404 ? "notFound" : "failed",
        );
        return;
      }

      populate(result.data);
      setRoomState("loaded");
    }

    function populate(room: RoomForHost) {
      setType(room.type);
      setPosition(room.position === null ? "" : String(room.position));

      switch (room.type) {
        case "Bathroom":
          setBathOrShowerStyle(room.bathOrShowerStyle ?? "none");
          break;
        case "Bedroom":
          setBedTypes(room.bedTypes);
          break;
        case "Kitchen":
          setAppliances(room.appliances);
          break;
        case "Den":
        case "LivingRoom":
          break;
        default: {
          const _never: never = room;
          throw new Error(`Unhandled room type: ${String(_never)}`);
        }
      }

      const en = room.localizedTexts.find((row) => row.locale === "en-US");
      setEnTitle(en?.title ?? "");
      setEnDescription(en?.markdown ?? "");

      const es = room.localizedTexts.find((row) => row.locale === "es-ES");
      if (es) {
        setAddSpanish(true);
        setEsTitle(es.title ?? "");
        setEsDescription(es.markdown ?? "");
      }
    }

    void load(placeId, id);
  }, [ready, user, placeId, id]);

  function toggleBedType(bedType: BedType) {
    setBedTypes((current) =>
      current.includes(bedType)
        ? current.filter((value) => value !== bedType)
        : [...current, bedType],
    );
  }

  function toggleAppliance(appliance: Appliance) {
    setAppliances((current) =>
      current.includes(appliance)
        ? current.filter((value) => value !== appliance)
        : [...current, appliance],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!placeId || !id || type === null) return;

    const trimmedTitle = enTitle.trim();
    const trimmedDescription = enDescription.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setError("A default (English) title and description are required.");
      return;
    }

    const trimmedPosition = position.trim();
    let positionValue: number | null = null;
    if (trimmedPosition) {
      const parsed = Number(trimmedPosition);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError("Position must be a whole number of at least 1.");
        return;
      }
      positionValue = parsed;
    }

    // Only locales present in this payload are kept; omitting es-ES removes it. en-US
    // is always sent and is never removable server-side.
    const localizedTexts: LocalizedTextPayload[] = [
      { locale: "en-US", title: trimmedTitle, markdown: trimmedDescription },
    ];

    if (addSpanish) {
      const trimmedEsTitle = esTitle.trim();
      const trimmedEsDescription = esDescription.trim();
      if (trimmedEsTitle || trimmedEsDescription) {
        localizedTexts.push({
          locale: "es-ES",
          title: trimmedEsTitle || null,
          markdown: trimmedEsDescription || null,
        });
      }
    }

    // The Room type is fixed and never sent; only the existing type's fields are.
    const body: RoomUpdateBody = { position: positionValue, localizedTexts };

    switch (type) {
      case "Bathroom":
        body.bathOrShowerStyle = bathOrShowerStyle;
        break;
      case "Bedroom":
        body.bedTypes = [...bedTypes];
        break;
      case "Kitchen":
        body.appliances = [...appliances];
        break;
      case "Den":
      case "LivingRoom":
        break;
      default: {
        const _never: never = type;
        throw new Error(`Unhandled room type: ${String(_never)}`);
      }
    }

    setSubmitState("submitting");
    const { error: apiError } = await patchV1HostPlacesByPlaceIdRoomsById({
      path: { placeId, id },
      body,
    });

    if (apiError) {
      setSubmitState("idle");
      setError("We could not save this room. Please try again.");
      return;
    }

    // Return to the Host Room show page after a successful save.
    navigate(`/host/places/${placeId}/rooms/${id}`);
  }

  const isSubmitting = submitState === "submitting";
  const backTo =
    placeId && id ? `/host/places/${placeId}/rooms/${id}` : "/host/places";

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to={backTo}
          >
            Back to room
          </Link>
        }
      />

      <section className="py-8">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            {type !== null ? roomTypeLabel(type) : "Hosting"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
            Edit room
          </h1>
        </div>

        {!ready ? (
          <StatusCard testId="host-room-edit-status">Loading...</StatusCard>
        ) : !user ? (
          <StatusCard testId="host-room-edit-status">
            <Link className="font-semibold text-[#18181a] underline" to="/auth">
              Sign in
            </Link>{" "}
            to edit this room.
          </StatusCard>
        ) : hostState === "loading" ? (
          <StatusCard testId="host-room-edit-status">
            Loading your hosting profile...
          </StatusCard>
        ) : hostState === "failed" ? (
          <StatusCard testId="host-room-edit-status" isError>
            We could not load your hosting profile right now.
          </StatusCard>
        ) : hostState === "absent" ? (
          // Item 3's index owns onboarding; send the not-yet-a-Host User there.
          <Navigate replace to="/host/places" />
        ) : roomState === "loading" ? (
          <StatusCard testId="host-room-edit-status">Loading room...</StatusCard>
        ) : roomState === "notFound" ? (
          <div className="space-y-4">
            <StatusCard testId="host-room-edit-status" isError>
              We could not find that room.
            </StatusCard>
            <BackLink to={backTo} />
          </div>
        ) : roomState === "failed" || type === null ? (
          <div className="space-y-4">
            <StatusCard testId="host-room-edit-status" isError>
              We could not load this room right now.
            </StatusCard>
            <BackLink to={backTo} />
          </div>
        ) : (
          <div
            className="max-w-2xl border border-[#deded8] bg-white p-6"
            data-testid="host-room-edit-form"
          >
            <form className="space-y-5" onSubmit={(event) => void submit(event)}>
              {/* Room type is fixed after creation: shown read-only, never editable. */}
              <div className="block">
                <span className="text-sm font-medium text-[#4f4f4a]">
                  Room type
                </span>
                <p
                  className="mt-2 flex h-11 items-center border border-[#e6e6e0] bg-[#f6f6f2] px-3 text-base font-semibold text-[#3f3f3a]"
                  data-testid="host-room-type-fixed"
                >
                  {roomTypeLabel(type)}
                </p>
              </div>

              <Field label="Position (optional)">
                <input
                  className={inputClass}
                  data-testid="host-room-position"
                  inputMode="numeric"
                  min={1}
                  onChange={(event) => setPosition(event.target.value)}
                  type="number"
                  value={position}
                />
              </Field>

              {type === "Bathroom" && (
                <Field label="Bath or shower style">
                  <select
                    className={inputClass}
                    data-testid="host-room-bath-or-shower-style"
                    onChange={(event) =>
                      setBathOrShowerStyle(
                        event.target.value as BathOrShowerStyle,
                      )
                    }
                    value={bathOrShowerStyle}
                  >
                    {BATH_OR_SHOWER_STYLES.map((option) => (
                      <option key={option} value={option}>
                        {humanize(option)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {type === "Bedroom" && (
                <fieldset className="space-y-2" data-testid="host-room-bed-types">
                  <legend className="text-sm font-medium text-[#4f4f4a]">
                    Bed types
                  </legend>
                  {BED_TYPES.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-sm text-[#3f3f3a]"
                    >
                      <input
                        checked={bedTypes.includes(option)}
                        data-testid={`host-room-bed-type-${option}`}
                        onChange={() => toggleBedType(option)}
                        type="checkbox"
                      />
                      {humanize(option)}
                    </label>
                  ))}
                </fieldset>
              )}

              {type === "Kitchen" && (
                <fieldset
                  className="space-y-2"
                  data-testid="host-room-appliances"
                >
                  <legend className="text-sm font-medium text-[#4f4f4a]">
                    Appliances
                  </legend>
                  {APPLIANCES.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-sm text-[#3f3f3a]"
                    >
                      <input
                        checked={appliances.includes(option)}
                        data-testid={`host-room-appliance-${option}`}
                        onChange={() => toggleAppliance(option)}
                        type="checkbox"
                      />
                      {humanize(option)}
                    </label>
                  ))}
                </fieldset>
              )}

              <fieldset className="space-y-4 border-t border-[#ecece6] pt-5">
                <legend className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                  Listing (English)
                </legend>
                <Field label="Title">
                  <input
                    className={inputClass}
                    data-testid="host-room-en-title"
                    onChange={(event) => setEnTitle(event.target.value)}
                    value={enTitle}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className={textareaClass}
                    data-testid="host-room-en-description"
                    onChange={(event) => setEnDescription(event.target.value)}
                    value={enDescription}
                  />
                </Field>
              </fieldset>

              {addSpanish ? (
                <fieldset className="space-y-4 border-t border-[#ecece6] pt-5">
                  <div className="flex items-center justify-between">
                    <legend className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                      Listing (Spanish)
                    </legend>
                    <button
                      className="text-sm font-semibold text-[#4f4f4a] underline"
                      data-testid="host-room-remove-spanish"
                      onClick={() => {
                        setAddSpanish(false);
                        setEsTitle("");
                        setEsDescription("");
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <Field label="Title">
                    <input
                      className={inputClass}
                      data-testid="host-room-es-title"
                      onChange={(event) => setEsTitle(event.target.value)}
                      value={esTitle}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      className={textareaClass}
                      data-testid="host-room-es-description"
                      onChange={(event) => setEsDescription(event.target.value)}
                      value={esDescription}
                    />
                  </Field>
                </fieldset>
              ) : (
                <button
                  className="text-sm font-semibold text-[#18181a] underline"
                  data-testid="host-room-add-spanish"
                  onClick={() => setAddSpanish(true)}
                  type="button"
                >
                  Add Spanish (es-ES)
                </button>
              )}

              <button
                className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
                data-testid="host-room-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>

              {error && (
                <p
                  className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]"
                  data-testid="host-room-error"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </form>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#4f4f4a]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function BackLink({ to }: { to: string }) {
  return (
    <Link
      className="inline-flex h-11 items-center border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
      data-testid="host-room-back"
      to={to}
    >
      Back to room
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

const inputClass =
  "h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]";
const textareaClass =
  "min-h-24 w-full resize-y border border-[#d9d9d2] bg-white px-3 py-2 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]";
