import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getV1Host, postV1HostPlaces } from "../api/backend/generated";
import type { PostV1HostPlacesData } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

// Full-page Place create route. Resolves the current User's Host first: `GET /v1/host`
// answers 404 when the signed-in User is not a Host yet, which routes back to
// `/host/places` where item 3 owns the onboarding surface — this page never rebuilds it.
type HostState = "loading" | "absent" | "present" | "failed";
type SubmitState = "idle" | "submitting";

type PlaceStyle = NonNullable<NonNullable<PostV1HostPlacesData["body"]>["style"]>;
type LocalizedTextPayload = NonNullable<
  NonNullable<PostV1HostPlacesData["body"]>["localizedTexts"]
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

export default function HostPlaceNew() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  const [hostState, setHostState] = useState<HostState>("loading");

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

  // Resolve the Host on mount / when the signed-in User changes. Inline async load
  // keeps the first statement an await (no synchronous setState inside an effect).
  useEffect(() => {
    if (!ready || !user) return;

    async function load() {
      const { data, error: apiError, response } = await getV1Host();

      if (data) {
        setHostState("present");
        return;
      }

      setHostState(apiError && response?.status === 404 ? "absent" : "failed");
    }

    void load();
  }, [ready, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    const { data, error: apiError } = await postV1HostPlaces({
      body: {
        name: trimmedName,
        style,
        sleeps: sleepsValue,
        localizedTexts,
      },
    });

    if (apiError || !data) {
      setSubmitState("idle");
      setError("We could not create this place. Please try again.");
      return;
    }

    // Land on the Host Place show page for the new Place (item 5 route).
    navigate(`/host/places/${data.id}`);
  }

  const isSubmitting = submitState === "submitting";

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
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            Hosting
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
            New place
          </h1>
        </div>

        {!ready ? (
          <StatusCard testId="host-place-new-status">Loading...</StatusCard>
        ) : !user ? (
          <StatusCard testId="host-place-new-status">
            <Link className="font-semibold text-[#18181a] underline" to="/auth">
              Sign in
            </Link>{" "}
            to add a place.
          </StatusCard>
        ) : hostState === "loading" ? (
          <StatusCard testId="host-place-new-status">
            Loading your hosting profile...
          </StatusCard>
        ) : hostState === "failed" ? (
          <StatusCard testId="host-place-new-status" isError>
            We could not load your hosting profile right now.
          </StatusCard>
        ) : hostState === "absent" ? (
          // Item 3's index owns onboarding; send the not-yet-a-Host User there.
          <Navigate replace to="/host/places" />
        ) : (
          <div
            className="max-w-2xl border border-[#deded8] bg-white p-6"
            data-testid="host-place-new-form"
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
                {isSubmitting ? "Creating..." : "Create place"}
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
