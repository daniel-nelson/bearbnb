import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";
import { getV1Host, getV1HostPlaces, postV1Host } from "../api/backend/generated";
import type { PlaceSummary, PostV1HostData } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../lib/authContext";

// The index resolves the current User's Host before touching any nested Host
// management endpoint. `GET /v1/host` answers 404 when the signed-in User has no
// Host yet; that 404 routes into onboarding instead of calling
// `GET /v1/host/places`, which requires an existing `currentHost`.
type HostState = "loading" | "absent" | "present" | "failed";
type PlacesState = "loading" | "loaded" | "failed";

export default function HostPlaces() {
  const { user, ready } = useAuth();

  const [hostState, setHostState] = useState<HostState>("loading");
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [placesState, setPlacesState] = useState<PlacesState>("loading");

  const loadPlaces = useCallback(async () => {
    setPlacesState("loading");
    const { data, error } = await getV1HostPlaces();

    if (error || !data) {
      setPlacesState("failed");
      return;
    }

    setPlaces(data.results);
    setPlacesState("loaded");
  }, []);

  // Resolve the Host, then its Places. Split out so both the mount effect and the
  // onboarding-success handler share one path; the mount effect wraps it so the
  // first statement it runs is an await (no synchronous setState inside an effect).
  const loadHostAndPlaces = useCallback(async () => {
    const { data, error, response } = await getV1Host();

    if (data) {
      setHostState("present");
      await loadPlaces();
      return;
    }

    // A 404 is the expected "this User is not a Host yet" signal and sends the
    // page into onboarding; any other failure is a genuine error.
    setHostState(error && response?.status === 404 ? "absent" : "failed");
  }, [loadPlaces]);

  const handleHostCreated = useCallback(() => {
    setHostState("loading");
    void loadHostAndPlaces();
  }, [loadHostAndPlaces]);

  useEffect(() => {
    // Re-runs whenever the signed-in User changes; `AuthProvider` sets the bearer
    // before exposing the new `user`, so the token is current by the time we fetch.
    if (!ready || !user) return;

    async function load() {
      await loadHostAndPlaces();
    }

    void load();
  }, [ready, user, loadHostAndPlaces]);

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to="/"
          >
            View site
          </Link>
        }
      />

      <section className="py-8">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            Hosting
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#111113]">
            Your places
          </h1>
        </div>

        {!ready ? (
          <StatusCard testId="host-places-status">Loading...</StatusCard>
        ) : !user ? (
          <StatusCard testId="host-places-status">
            <Link className="font-semibold text-[#18181a] underline" to="/auth">
              Sign in
            </Link>{" "}
            to manage your places.
          </StatusCard>
        ) : hostState === "loading" ? (
          <StatusCard testId="host-places-status">
            Loading your hosting profile...
          </StatusCard>
        ) : hostState === "failed" ? (
          <StatusCard testId="host-places-status" isError>
            We could not load your hosting profile right now.
          </StatusCard>
        ) : hostState === "absent" ? (
          <HostOnboarding onHostCreated={handleHostCreated} />
        ) : (
          <PlacesList
            places={places}
            state={placesState}
            onRetry={() => void loadPlaces()}
          />
        )}
      </section>
    </AppShell>
  );
}

function PlacesList({
  places,
  state,
  onRetry,
}: {
  places: PlaceSummary[];
  state: PlacesState;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return <StatusCard testId="host-places-status">Loading places...</StatusCard>;
  }

  if (state === "failed") {
    return (
      <div className="space-y-4">
        <StatusCard testId="host-places-status" isError>
          We could not load your places right now.
        </StatusCard>
        <button
          className="h-11 border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div
        className="border border-[#deded8] bg-white px-6 py-10 text-center"
        data-testid="host-places-empty"
      >
        <h2 className="text-xl font-semibold text-[#171719]">No places yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#62625c]">
          Add your first place to start hosting guests on BearBnB.
        </p>
        <div className="mt-6">
          <NewPlaceLink />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#62625c]">
          {places.length} {places.length === 1 ? "place" : "places"}
        </p>
        <NewPlaceLink />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="host-places-list">
        {places.map((place) => (
          <li
            className="border border-[#deded8] bg-white transition hover:border-[#b9b9b1]"
            key={place.id}
          >
            <Link
              className="block p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1d1d1f]"
              data-testid="host-place-link"
              to={`/host/places/${place.id}`}
            >
              <p className="break-words text-lg font-semibold text-[#171719]">
                {place.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewPlaceLink() {
  return (
    <Link
      className="inline-flex h-11 items-center bg-[#1d1d1f] px-5 text-sm font-semibold text-white transition hover:bg-[#333336]"
      data-testid="host-place-new"
      to="/host/places/new"
    >
      New place
    </Link>
  );
}

type OnboardingSubmitState = "idle" | "submitting";

// First-pass Host onboarding lives on the Places index because Host setup is a
// prerequisite for every nested Host management endpoint. It collects the legal
// setup plus the default-locale profile text the backend requires, and lets the
// host optionally add the one other supported locale (es-ES) before saving.
function HostOnboarding({ onHostCreated }: { onHostCreated: () => void }) {
  const [legalName, setLegalName] = useState("");
  const [enTitle, setEnTitle] = useState("");
  const [enDescription, setEnDescription] = useState("");
  const [addSpanish, setAddSpanish] = useState(false);
  const [esTitle, setEsTitle] = useState("");
  const [esDescription, setEsDescription] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitState, setSubmitState] = useState<OnboardingSubmitState>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedLegalName = legalName.trim();
    const trimmedTitle = enTitle.trim();
    const trimmedDescription = enDescription.trim();

    if (!trimmedLegalName) {
      setError("Enter the legal name for your hosting account.");
      return;
    }
    if (!trimmedTitle || !trimmedDescription) {
      setError("A default (English) title and description are required.");
      return;
    }
    if (!agreed) {
      setError("Please accept the host agreement to continue.");
      return;
    }

    type LocalizedTextPayload = NonNullable<
      NonNullable<PostV1HostData["body"]>["localizedTexts"]
    >[number];

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
    const { data, error: apiError } = await postV1Host({
      body: {
        legalName: trimmedLegalName,
        // The agreement timestamp records when the host accepted; Luxon keeps the
        // datetime handling off raw `Date`.
        signedHostAgreementAt: DateTime.utc().toISO(),
        localizedTexts,
      },
    });

    if (apiError || !data) {
      setSubmitState("idle");
      setError("We could not create your hosting profile. Please try again.");
      return;
    }

    onHostCreated();
  }

  const isSubmitting = submitState === "submitting";

  return (
    <div
      className="max-w-2xl border border-[#deded8] bg-white p-6"
      data-testid="host-onboarding"
    >
      <h2 className="text-2xl font-semibold tracking-normal text-[#151516]">
        Become a host
      </h2>
      <p className="mt-2 text-sm text-[#62625c]">
        Set up your hosting profile before adding your first place.
      </p>

      <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)}>
        <Field label="Legal name">
          <input
            className={inputClass}
            data-testid="host-onboarding-legal-name"
            onChange={(event) => setLegalName(event.target.value)}
            value={legalName}
          />
        </Field>

        <fieldset className="space-y-4 border-t border-[#ecece6] pt-5">
          <legend className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
            Profile (English)
          </legend>
          <Field label="Title">
            <input
              className={inputClass}
              data-testid="host-onboarding-en-title"
              onChange={(event) => setEnTitle(event.target.value)}
              value={enTitle}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={textareaClass}
              data-testid="host-onboarding-en-description"
              onChange={(event) => setEnDescription(event.target.value)}
              value={enDescription}
            />
          </Field>
        </fieldset>

        {addSpanish ? (
          <fieldset className="space-y-4 border-t border-[#ecece6] pt-5">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-medium uppercase tracking-[0.12em] text-[#707069]">
                Profile (Spanish)
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
                data-testid="host-onboarding-es-title"
                onChange={(event) => setEsTitle(event.target.value)}
                value={esTitle}
              />
            </Field>
            <Field label="Description">
              <textarea
                className={textareaClass}
                data-testid="host-onboarding-es-description"
                onChange={(event) => setEsDescription(event.target.value)}
                value={esDescription}
              />
            </Field>
          </fieldset>
        ) : (
          <button
            className="text-sm font-semibold text-[#18181a] underline"
            data-testid="host-onboarding-add-spanish"
            onClick={() => setAddSpanish(true)}
            type="button"
          >
            Add Spanish (es-ES)
          </button>
        )}

        <label className="flex items-start gap-3 border-t border-[#ecece6] pt-5 text-sm text-[#4f4f4a]">
          <input
            checked={agreed}
            className="mt-1 h-4 w-4"
            data-testid="host-onboarding-agreement"
            onChange={(event) => setAgreed(event.target.checked)}
            type="checkbox"
          />
          <span>I accept the BearBnB host agreement.</span>
        </label>

        <button
          className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
          data-testid="host-onboarding-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Setting up..." : "Create hosting profile"}
        </button>

        {error && (
          <p
            className="border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#4f4f4a]"
            data-testid="host-onboarding-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </form>
    </div>
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
