import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  getV1Host,
  getV1HostPlacesById,
  postV1HostPlacesByPlaceIdRooms,
} from "../api/backend/generated";
import type { PostV1HostPlacesByPlaceIdRoomsData } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

// Full-page Room create route, scoped to a Place. Resolves the current User's Host first
// (`GET /v1/host` answers 404 when the signed-in User is not a Host yet, which routes back
// to `/host/places` where item 3 owns onboarding), then loads the parent Place for context
// and back-navigation. The form asks for the Room type first, then adapts to show only the
// fields relevant to that type. Create posts the nested owner Room endpoint with the
// multi-locale localized text payload in one request.
type HostState = "loading" | "absent" | "present" | "failed";
type PlaceState = "loading" | "loaded" | "notFound" | "failed";
type SubmitState = "idle" | "submitting";

type RoomCreateBody = NonNullable<PostV1HostPlacesByPlaceIdRoomsData["body"]>;
type RoomType = NonNullable<RoomCreateBody["type"]>;
type BathOrShowerStyle = NonNullable<RoomCreateBody["bathOrShowerStyle"]>;
type BedType = NonNullable<RoomCreateBody["bedTypes"]>[number];
type Appliance = NonNullable<RoomCreateBody["appliances"]>[number];
type LocalizedTextPayload = NonNullable<RoomCreateBody["localizedTexts"]>[number];

// Typed against the SDK unions so a backend enum change surfaces here at build time. The
// generated client exposes these enums only as TS unions on the body type (no runtime
// values array), matching the hand-listed pattern used for Place styles.
const ROOM_TYPES: readonly RoomType[] = [
  "Bathroom",
  "Bedroom",
  "Den",
  "Kitchen",
  "LivingRoom",
];
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

export default function HostRoomNew() {
  const { user, ready } = useAuth();
  const { placeId } = useParams();
  const navigate = useNavigate();

  const [hostState, setHostState] = useState<HostState>("loading");
  const [placeState, setPlaceState] = useState<PlaceState>("loading");
  const [placeName, setPlaceName] = useState("");

  const [type, setType] = useState<RoomType | "">("");
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

  // Resolve the Host, then the parent Place for context. Inline async load keeps the
  // first statement an await (no synchronous setState inside an effect).
  useEffect(() => {
    if (!ready || !user || !placeId) return;

    async function load(id: string) {
      const { data, error: apiError, response } = await getV1Host();

      if (!data) {
        // A 404 is the expected "this User is not a Host yet" signal.
        setHostState(apiError && response?.status === 404 ? "absent" : "failed");
        return;
      }

      setHostState("present");
      setPlaceState("loading");

      const place = await getV1HostPlacesById({ path: { id } });

      if (place.data) {
        setPlaceName(place.data.name);
        setPlaceState("loaded");
        return;
      }

      setPlaceState(place.response?.status === 404 ? "notFound" : "failed");
    }

    void load(placeId);
  }, [ready, user, placeId]);

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

    if (!placeId) return;
    if (type === "") {
      setError("Choose a room type.");
      return;
    }

    const trimmedTitle = enTitle.trim();
    const trimmedDescription = enDescription.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setError("A default (English) title and description are required.");
      return;
    }

    const trimmedPosition = position.trim();
    let positionValue: number | undefined;
    if (trimmedPosition) {
      const parsed = Number(trimmedPosition);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError("Position must be a whole number of at least 1.");
        return;
      }
      positionValue = parsed;
    }

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

    const body: RoomCreateBody = { type, localizedTexts };
    if (positionValue !== undefined) body.position = positionValue;

    // Only the fields relevant to the chosen type are sent.
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
    const { data, error: apiError } = await postV1HostPlacesByPlaceIdRooms({
      path: { placeId },
      body,
    });

    if (apiError || !data) {
      setSubmitState("idle");
      setError("We could not create this room. Please try again.");
      return;
    }

    // Land on the Host Room show page for the new Room (item 8 route).
    navigate(`/host/places/${placeId}/rooms/${data.id}`);
  }

  const isSubmitting = submitState === "submitting";
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
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            {placeState === "loaded" ? placeName : "Hosting"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
            New room
          </h1>
        </div>

        {!ready ? (
          <StatusCard testId="host-room-new-status">Loading...</StatusCard>
        ) : !user ? (
          <StatusCard testId="host-room-new-status">
            <Link className="font-semibold text-[#18181a] underline" to="/auth">
              Sign in
            </Link>{" "}
            to add a room.
          </StatusCard>
        ) : hostState === "loading" ? (
          <StatusCard testId="host-room-new-status">
            Loading your hosting profile...
          </StatusCard>
        ) : hostState === "failed" ? (
          <StatusCard testId="host-room-new-status" isError>
            We could not load your hosting profile right now.
          </StatusCard>
        ) : hostState === "absent" ? (
          // Item 3's index owns onboarding; send the not-yet-a-Host User there.
          <Navigate replace to="/host/places" />
        ) : placeState === "loading" ? (
          <StatusCard testId="host-room-new-status">Loading place...</StatusCard>
        ) : placeState === "notFound" ? (
          <div className="space-y-4">
            <StatusCard testId="host-room-new-status" isError>
              We could not find that place.
            </StatusCard>
            <Link
              className="inline-flex items-center text-sm font-semibold text-[#18181a] underline"
              to="/host/places"
            >
              Back to places
            </Link>
          </div>
        ) : placeState === "failed" ? (
          <div className="space-y-4">
            <StatusCard testId="host-room-new-status" isError>
              We could not load that place right now.
            </StatusCard>
            <Link
              className="inline-flex items-center text-sm font-semibold text-[#18181a] underline"
              to={backTo}
            >
              Back to place
            </Link>
          </div>
        ) : (
          <div
            className="max-w-2xl border border-[#deded8] bg-white p-6"
            data-testid="host-room-new-form"
          >
            <form className="space-y-5" onSubmit={(event) => void submit(event)}>
              <Field label="Room type">
                <select
                  className={inputClass}
                  data-testid="host-room-type"
                  onChange={(event) =>
                    setType(event.target.value as RoomType | "")
                  }
                  value={type}
                >
                  <option value="">Select a room type</option>
                  {ROOM_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {roomTypeLabel(option)}
                    </option>
                  ))}
                </select>
              </Field>

              {type !== "" && (
                <>
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
                    <fieldset
                      className="space-y-2"
                      data-testid="host-room-bed-types"
                    >
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
                        onChange={(event) =>
                          setEnDescription(event.target.value)
                        }
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
                          onChange={(event) =>
                            setEsDescription(event.target.value)
                          }
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
                    {isSubmitting ? "Creating..." : "Create room"}
                  </button>
                </>
              )}

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
