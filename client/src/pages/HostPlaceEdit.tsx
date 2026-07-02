import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  getV1Host,
  getV1HostPlacesById,
  patchV1HostPlacesById,
} from "../api/backend/generated";
import type {
  PatchV1HostPlacesByIdData,
  PlaceForHost,
} from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

// Full-page Place edit route. Resolves the current User's Host first (`GET /v1/host`
// answers 404 when the signed-in User is not a Host yet, which routes back to
// `/host/places` where item 3 owns onboarding), loads the Place through the Host show
// endpoint to populate management fields and localized rows, then saves everything —
// including localized-text add/remove — through the owner Place update endpoint in a
// single request. `en-US` is the required fallback locale and cannot be removed.
type HostState = "loading" | "absent" | "present" | "failed";
type PlaceState = "loading" | "loaded" | "notFound" | "failed";
type SubmitState = "idle" | "submitting";

type PlaceStyle = NonNullable<
  NonNullable<PatchV1HostPlacesByIdData["body"]>["style"]
>;
type LocalizedTextPayload = NonNullable<
  NonNullable<PatchV1HostPlacesByIdData["body"]>["localizedTexts"]
>[number];

// Typed against the SDK union so a backend style change surfaces here at build time.
const PLACE_STYLES: readonly PlaceStyle[] = [
  "cabin",
  "cave",
  "cottage",
  "dump",
  "lean_to",
  "tent",
  "treehouse",
];

function styleLabel(style: PlaceStyle): string {
  const spaced = style.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function HostPlaceEdit() {
  const { user, ready } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [hostState, setHostState] = useState<HostState>("loading");
  const [placeState, setPlaceState] = useState<PlaceState>("loading");

  const [name, setName] = useState("");
  const [style, setStyle] = useState<PlaceStyle>("cabin");
  const [sleeps, setSleeps] = useState("");
  const [enTitle, setEnTitle] = useState("");
  const [enDescription, setEnDescription] = useState("");
  const [addSpanish, setAddSpanish] = useState(false);
  const [esTitle, setEsTitle] = useState("");
  const [esDescription, setEsDescription] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  // Resolve the Host, then load the Place and populate the form. Inline async load
  // keeps the first statement an await (no synchronous setState inside an effect).
  useEffect(() => {
    if (!ready || !user || !id) return;

    async function load(placeId: string) {
      const { data, error: apiError, response } = await getV1Host();

      if (!data) {
        setHostState(apiError && response?.status === 404 ? "absent" : "failed");
        return;
      }

      setHostState("present");
      setPlaceState("loading");

      const place = await getV1HostPlacesById({ path: { id: placeId } });

      if (!place.data) {
        setPlaceState(place.response?.status === 404 ? "notFound" : "failed");
        return;
      }

      populate(place.data);
      setPlaceState("loaded");
    }

    function populate(place: PlaceForHost) {
      setName(place.name);
      setStyle(place.style);
      setSleeps(String(place.sleeps));

      const en = place.localizedTexts.find((row) => row.locale === "en-US");
      setEnTitle(en?.title ?? "");
      setEnDescription(en?.markdown ?? "");

      const es = place.localizedTexts.find((row) => row.locale === "es-ES");
      if (es) {
        setAddSpanish(true);
        setEsTitle(es.title ?? "");
        setEsDescription(es.markdown ?? "");
      }
    }

    void load(id);
  }, [ready, user, id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setError("");

    const trimmedName = name.trim();
    const trimmedTitle = enTitle.trim();
    const trimmedDescription = enDescription.trim();
    const sleepsValue = Number(sleeps);

    if (!trimmedName) {
      setError("Enter a name for this place.");
      return;
    }
    if (!Number.isInteger(sleepsValue) || sleepsValue < 1) {
      setError("Sleeps must be a whole number of at least 1.");
      return;
    }
    if (!trimmedTitle || !trimmedDescription) {
      setError("A default (English) title and description are required.");
      return;
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

    setSubmitState("submitting");
    const { error: apiError } = await patchV1HostPlacesById({
      path: { id },
      body: {
        name: trimmedName,
        style,
        sleeps: sleepsValue,
        localizedTexts,
      },
    });

    if (apiError) {
      setSubmitState("idle");
      setError("We could not save this place. Please try again.");
      return;
    }

    // Return to the Host Place show page after a successful save.
    navigate(`/host/places/${id}`);
  }

  const isSubmitting = submitState === "submitting";

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to={id ? `/host/places/${id}` : "/host/places"}
          >
            Back to place
          </Link>
        }
      />

      <section className="py-8">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            Hosting
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
            Edit place
          </h1>
        </div>

        {!ready ? (
          <StatusCard testId="host-place-edit-status">Loading...</StatusCard>
        ) : !user ? (
          <StatusCard testId="host-place-edit-status">
            <Link className="font-semibold text-[#18181a] underline" to="/auth">
              Sign in
            </Link>{" "}
            to edit this place.
          </StatusCard>
        ) : hostState === "loading" ? (
          <StatusCard testId="host-place-edit-status">
            Loading your hosting profile...
          </StatusCard>
        ) : hostState === "failed" ? (
          <StatusCard testId="host-place-edit-status" isError>
            We could not load your hosting profile right now.
          </StatusCard>
        ) : hostState === "absent" ? (
          // Item 3's index owns onboarding; send the not-yet-a-Host User there.
          <Navigate replace to="/host/places" />
        ) : placeState === "loading" ? (
          <StatusCard testId="host-place-edit-status">
            Loading place...
          </StatusCard>
        ) : placeState === "notFound" ? (
          <div className="space-y-4">
            <StatusCard testId="host-place-edit-status" isError>
              We could not find that place.
            </StatusCard>
            <BackToPlacesLink />
          </div>
        ) : placeState === "failed" ? (
          <div className="space-y-4">
            <StatusCard testId="host-place-edit-status" isError>
              We could not load this place right now.
            </StatusCard>
            <BackToPlacesLink />
          </div>
        ) : (
          <div
            className="max-w-2xl border border-[#deded8] bg-white p-6"
            data-testid="host-place-edit-form"
          >
            <form className="space-y-5" onSubmit={(event) => void submit(event)}>
              <Field label="Name">
                <input
                  className={inputClass}
                  data-testid="host-place-name"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </Field>

              <Field label="Style">
                <select
                  className={inputClass}
                  data-testid="host-place-style"
                  onChange={(event) => setStyle(event.target.value as PlaceStyle)}
                  value={style}
                >
                  {PLACE_STYLES.map((option) => (
                    <option key={option} value={option}>
                      {styleLabel(option)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Sleeps">
                <input
                  className={inputClass}
                  data-testid="host-place-sleeps"
                  inputMode="numeric"
                  min={1}
                  onChange={(event) => setSleeps(event.target.value)}
                  type="number"
                  value={sleeps}
                />
              </Field>

              <fieldset className="space-y-4 border-t border-[#ecece6] pt-5">
                <legend className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                  Listing (English)
                </legend>
                <Field label="Title">
                  <input
                    className={inputClass}
                    data-testid="host-place-en-title"
                    onChange={(event) => setEnTitle(event.target.value)}
                    value={enTitle}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className={textareaClass}
                    data-testid="host-place-en-description"
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
                      data-testid="host-place-remove-spanish"
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
                      data-testid="host-place-es-title"
                      onChange={(event) => setEsTitle(event.target.value)}
                      value={esTitle}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      className={textareaClass}
                      data-testid="host-place-es-description"
                      onChange={(event) => setEsDescription(event.target.value)}
                      value={esDescription}
                    />
                  </Field>
                </fieldset>
              ) : (
                <button
                  className="text-sm font-semibold text-[#18181a] underline"
                  data-testid="host-place-add-spanish"
                  onClick={() => setAddSpanish(true)}
                  type="button"
                >
                  Add Spanish (es-ES)
                </button>
              )}

              <button
                className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
                data-testid="host-place-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>

              {error && (
                <p
                  className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]"
                  data-testid="host-place-error"
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

const inputClass =
  "h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]";
const textareaClass =
  "min-h-24 w-full resize-y border border-[#d9d9d2] bg-white px-3 py-2 text-base text-[#171717] outline-none transition focus:border-[#1d1d1f]";
