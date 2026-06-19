import { useEffect, useState, type FormEvent } from "react";
import { DateTime } from "luxon";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  apiHost,
  checkApiHealth,
  createGuestBooking,
  getGuestPlace,
  getGuestPlaceAvailability,
  getCurrentUser,
  listGuestPlaces,
  type CurrentUser,
  type GuestPlaceDetail,
  type GuestPlaceSummary,
  type OccupiedRange,
} from "./lib/apiClient";
import { auth } from "./lib/firebase";
import { BrowserRouter, Link, Route, Routes, useParams } from "react-router-dom";
import "./App.css";

const useTestAuth =
  import.meta.env.VITE_TEST_AUTH === "1" ||
  import.meta.env.VITE_PSYCHIC_ENV === "test";

function App() {
  const [apiState, setApiState] = useState<"loading" | "connected" | "failed">(
    "loading",
  );
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [email, setEmail] = useState("guest@example.com");
  const [password, setPassword] = useState("bearbnb-password");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authState, setAuthState] = useState<
    "checking" | "signed-out" | "signed-in"
  >(useTestAuth ? "signed-out" : "checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [testToken, setTestToken] = useState<string | null>(null);
  const [places, setPlaces] = useState<GuestPlaceSummary[]>([]);
  const [placesState, setPlacesState] = useState<
    "loading" | "loaded" | "failed"
  >("loading");

  useEffect(() => {
    let active = true;

    checkApiHealth()
      .then(() => {
        if (active) setApiState("connected");
      })
      .catch(() => {
        if (active) setApiState("failed");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    listGuestPlaces()
      .then(({ results }) => {
        if (!active) return;
        setPlaces(results);
        setPlacesState("loaded");
      })
      .catch(() => {
        if (active) setPlacesState("failed");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (useTestAuth) {
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setErrorMessage(null);

      if (!firebaseUser) {
        setCurrentUser(null);
        setAuthState("signed-out");
        return;
      }

      if (!firebaseUser.emailVerified) {
        setCurrentUser(null);
        setAuthState("signed-out");
        setNoticeMessage("Verify your email before signing in to BearBnB.");
        return;
      }

      const token = await firebaseUser.getIdToken();
      const user = await getCurrentUser(token);
      setCurrentUser(user);
      setAuthState("signed-in");
    });
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      if (useTestAuth) {
        await signInWithTestToken(email);
      } else if (authMode === "sign-up") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setNoticeMessage("Verify your email before signing in to BearBnB.");
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        if (!credential.user.emailVerified) {
          await signOut(auth);
          setNoticeMessage("Verify your email before signing in to BearBnB.");
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    }
  }

  async function signOutUser() {
    if (useTestAuth) {
      setCurrentUser(null);
      setAuthState("signed-out");
      setTestToken(null);
      return;
    }

    await signOut(auth);
  }

  async function signInWithTestToken(email: string) {
    const token = testAuthToken(email);
    const user = await getCurrentUser(token);
    setCurrentUser(user);
    setAuthState("signed-in");
    setNoticeMessage(null);
    setTestToken(token);
  }

  async function currentAuthToken() {
    if (useTestAuth) return testToken;
    return (await auth.currentUser?.getIdToken()) ?? null;
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>BearBnB</h1>
          <p>Guest booking workspace</p>
        </div>
        <div className="api-status" data-state={apiState}>
          <span>Psychic API</span>
          <strong>
            {apiState === "connected"
              ? "Connected"
              : apiState === "failed"
                ? "Unavailable"
                : "Checking"}
          </strong>
          <code>{apiHost}</code>
        </div>
      </header>

      <section className="auth-panel">
        {authState === "signed-in" && currentUser ? (
          <div className="signed-in">
            <div>
              <span className="eyebrow">Signed in</span>
              <h2>{currentUser.email}</h2>
              <p>Bearer token accepted by Psychic.</p>
            </div>
            <button type="button" onClick={signOutUser}>
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={submitAuth} data-testid="auth-form">
            <div className="segmented-control" aria-label="Authentication mode">
              <button
                type="button"
                aria-pressed={authMode === "sign-up"}
                onClick={() => setAuthMode("sign-up")}
              >
                Sign up
              </button>
              <button
                type="button"
                aria-pressed={authMode === "sign-in"}
                onClick={() => setAuthMode("sign-in")}
              >
                Sign in
              </button>
            </div>

            <label>
              Email
              <input
                data-testid="auth-email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                data-testid="auth-password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={
                  authMode === "sign-up" ? "new-password" : "current-password"
                }
              />
            </label>
            {noticeMessage ? <p className="form-notice">{noticeMessage}</p> : null}
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            <button
              type="submit"
              className="primary-action"
              data-testid="auth-submit"
            >
              {authMode === "sign-up" ? "Create account" : "Sign in"}
            </button>
            {useTestAuth ? (
              <button
                type="button"
                data-testid="test-auth-submit"
                onClick={(event) => {
                  const form = event.currentTarget.form;
                  const formData = form ? new FormData(form) : null;
                  void signInWithTestToken(
                    String(formData?.get("email") ?? email),
                  );
                }}
              >
                Continue as test guest
              </button>
            ) : null}
          </form>
        )}
      </section>

      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<PlacesIndex places={places} placesState={placesState} />}
          />
          <Route
            path="/places/:placeId"
            element={
              <PlaceDetail
                authState={authState}
                currentAuthToken={currentAuthToken}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </main>
  );
}

export default App;

function PlacesIndex({
  places,
  placesState,
}: {
  places: GuestPlaceSummary[];
  placesState: "loading" | "loaded" | "failed";
}) {
  return (
    <section className="places-section" aria-labelledby="places-heading">
      <div className="section-header">
        <div>
          <span className="eyebrow">Stay search</span>
          <h2 id="places-heading">Available places</h2>
        </div>
        <span className="result-count">{places.length} listed</span>
      </div>

      {placesState === "loading" ? (
        <p className="inline-state">Loading places...</p>
      ) : placesState === "failed" ? (
        <p className="inline-state" role="alert">
          Places are unavailable right now.
        </p>
      ) : places.length === 0 ? (
        <p className="inline-state">No places are listed yet.</p>
      ) : (
        <ul className="places-list">
          {places.map((place) => (
            <li key={place.id}>
              <Link className="place-row" to={`/places/${place.id}`}>
                <span>{place.title}</span>
                <span aria-hidden="true">View</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlaceDetail({
  authState,
  currentAuthToken,
}: {
  authState: "checking" | "signed-out" | "signed-in";
  currentAuthToken: () => Promise<string | null>;
}) {
  const { placeId } = useParams();
  const [place, setPlace] = useState<GuestPlaceDetail | null>(null);
  const [detailState, setDetailState] = useState<
    "loading" | "loaded" | "failed"
  >("loading");
  const [startsOn, setStartsOn] = useState(() =>
    DateTime.now().plus({ days: 1 }).toFormat("yyyy-MM-dd"),
  );
  const [endsOn, setEndsOn] = useState(() =>
    DateTime.now().plus({ days: 3 }).toFormat("yyyy-MM-dd"),
  );
  const [bookingState, setBookingState] = useState<
    "idle" | "submitting" | "booked" | "failed"
  >("idle");
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [occupiedRanges, setOccupiedRanges] = useState<OccupiedRange[]>([]);
  const [calendarSelectionStep, setCalendarSelectionStep] = useState<
    "start" | "end"
  >("start");

  useEffect(() => {
    if (!placeId) return;

    let active = true;

    Promise.all([getGuestPlace(placeId), getGuestPlaceAvailability(placeId)])
      .then(([place, availability]) => {
        if (!active) return;
        setPlace(place);
        setOccupiedRanges(availability.occupiedRanges);
        setDetailState("loaded");
      })
      .catch(() => {
        if (active) setDetailState("failed");
      });

    return () => {
      active = false;
    };
  }, [placeId]);

  return (
    <section className="detail-section" aria-labelledby="place-detail-heading">
      <Link className="back-link" to="/">
        Back to places
      </Link>

      {detailState === "loading" ? (
        <p className="inline-state">Loading place...</p>
      ) : !placeId || detailState === "failed" || !place ? (
        <p className="inline-state" role="alert">
          This place is unavailable right now.
        </p>
      ) : (
        <article className="place-detail">
          <div className="section-header">
            <div>
              <span className="eyebrow">{place.displayStyle}</span>
              <h2 id="place-detail-heading">{place.title}</h2>
            </div>
            <span className="result-count">Sleeps {place.sleeps}</span>
          </div>

          <section aria-labelledby="rooms-heading">
            <h3 id="rooms-heading">Rooms</h3>
            <ul className="room-list">
              {place.rooms.map((room) => (
                <li key={room.id}>
                  <strong>{room.title}</strong>
                  <span>{room.displayType}</span>
                </li>
              ))}
            </ul>
          </section>

          <BookingForm
            authState={authState}
            bookingMessage={bookingMessage}
            bookingState={bookingState}
            endsOn={endsOn}
            occupiedRanges={occupiedRanges}
            onEndsOnChange={setEndsOn}
            onSelectCalendarDate={(date) => {
              if (
                calendarSelectionStep === "start" ||
                DateTime.fromISO(date).toMillis() <= DateTime.fromISO(startsOn).toMillis()
              ) {
                setStartsOn(date);
                setEndsOn(
                  DateTime.fromISO(date).plus({ days: 1 }).toFormat("yyyy-MM-dd"),
                );
                setCalendarSelectionStep("end");
              } else {
                setEndsOn(date);
                setCalendarSelectionStep("start");
              }
              setBookingState("idle");
              setBookingMessage(null);
            }}
            onSubmit={async (event) => {
              event.preventDefault();
              setBookingMessage(null);

              if (!placeId) return;

              const formData = new FormData(event.currentTarget);
              const submittedStartsOn = String(formData.get("startsOn") ?? "");
              const submittedEndsOn = String(formData.get("endsOn") ?? "");
              const parsedStartsOn = DateTime.fromISO(submittedStartsOn);
              const parsedEndsOn = DateTime.fromISO(submittedEndsOn);
              if (
                !parsedStartsOn.isValid ||
                !parsedEndsOn.isValid ||
                parsedEndsOn <= parsedStartsOn
              ) {
                setBookingState("failed");
                setBookingMessage("Choose a checkout date after check-in.");
                return;
              }
              if (
                rangeOverlapsOccupiedNight(
                  submittedStartsOn,
                  submittedEndsOn,
                  occupiedRanges,
                )
              ) {
                setBookingState("failed");
                setBookingMessage("Choose dates without occupied nights.");
                return;
              }

              const token = await currentAuthToken();
              if (!token) {
                setBookingState("failed");
                setBookingMessage("Sign in before booking this place.");
                return;
              }

              setBookingState("submitting");
              try {
                await createGuestBooking({
                  placeId,
                  startsOn: submittedStartsOn,
                  endsOn: submittedEndsOn,
                  token,
                });
                setOccupiedRanges((currentRanges) => [
                  ...currentRanges,
                  { startsOn: submittedStartsOn, endsOn: submittedEndsOn },
                ]);
                setBookingState("booked");
                setBookingMessage("Booking confirmed.");
              } catch (error) {
                setBookingState("failed");
                setBookingMessage(
                  error instanceof Error
                    ? error.message
                    : "Booking could not be completed.",
                );
              }
            }}
            startsOn={startsOn}
            onStartsOnChange={setStartsOn}
          />
        </article>
      )}
    </section>
  );
}

function BookingForm({
  authState,
  bookingMessage,
  bookingState,
  endsOn,
  occupiedRanges,
  onEndsOnChange,
  onSelectCalendarDate,
  onStartsOnChange,
  onSubmit,
  startsOn,
}: {
  authState: "checking" | "signed-out" | "signed-in";
  bookingMessage: string | null;
  bookingState: "idle" | "submitting" | "booked" | "failed";
  endsOn: string;
  occupiedRanges: OccupiedRange[];
  onEndsOnChange: (value: string) => void;
  onSelectCalendarDate: (date: string) => void;
  onStartsOnChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  startsOn: string;
}) {
  const calendarDays = calendarWindow();

  return (
    <section aria-labelledby="booking-heading">
      <h3 id="booking-heading">Book this stay</h3>
      <div className="availability-calendar" aria-label="Availability calendar">
        {calendarDays.map((day) => {
          const isoDate = day.toFormat("yyyy-MM-dd");
          const occupied = isOccupiedNight(isoDate, occupiedRanges);
          const selected = isoDate === startsOn || isoDate === endsOn;

          return (
            <button
              aria-pressed={selected}
              className="calendar-day"
              data-testid={`calendar-day-${isoDate}`}
              data-occupied={occupied}
              disabled={occupied}
              key={isoDate}
              onClick={() => onSelectCalendarDate(isoDate)}
              type="button"
            >
              <span>{day.toFormat("ccc")}</span>
              <strong>{day.toFormat("d")}</strong>
            </button>
          );
        })}
      </div>
      <form className="booking-form" onSubmit={onSubmit}>
        <label>
          Check-in
          <input
            data-testid="booking-starts-on"
            name="startsOn"
            type="date"
            value={startsOn}
            onChange={(event) => onStartsOnChange(event.target.value)}
          />
        </label>
        <label>
          Checkout
          <input
            data-testid="booking-ends-on"
            name="endsOn"
            type="date"
            value={endsOn}
            onChange={(event) => onEndsOnChange(event.target.value)}
          />
        </label>
        {bookingMessage ? (
          <p
            className={bookingState === "booked" ? "form-notice" : "form-error"}
            role={bookingState === "failed" ? "alert" : undefined}
          >
            {bookingMessage}
          </p>
        ) : null}
        <button
          type="submit"
          className="primary-action"
          data-testid="booking-submit"
          disabled={bookingState === "submitting" || authState === "checking"}
        >
          {bookingState === "submitting" ? "Booking..." : "Book stay"}
        </button>
      </form>
    </section>
  );
}

function calendarWindow() {
  const firstDay = DateTime.now().startOf("day").plus({ days: 1 });
  return Array.from({ length: 28 }, (_value, index) =>
    firstDay.plus({ days: index }),
  );
}

function isOccupiedNight(date: string, occupiedRanges: OccupiedRange[]) {
  const day = DateTime.fromISO(date);

  return occupiedRanges.some((range) => {
    const startsOn = DateTime.fromISO(range.startsOn);
    const endsOn = DateTime.fromISO(range.endsOn);
    return day.toMillis() >= startsOn.toMillis() && day.toMillis() < endsOn.toMillis();
  });
}

function rangeOverlapsOccupiedNight(
  startsOn: string,
  endsOn: string,
  occupiedRanges: OccupiedRange[],
) {
  const candidateStart = DateTime.fromISO(startsOn);
  const candidateEnd = DateTime.fromISO(endsOn);

  return occupiedRanges.some((range) => {
    const occupiedStart = DateTime.fromISO(range.startsOn);
    const occupiedEnd = DateTime.fromISO(range.endsOn);
    return (
      candidateStart.toMillis() < occupiedEnd.toMillis() &&
      candidateEnd.toMillis() > occupiedStart.toMillis()
    );
  });
}

function testAuthToken(email: string) {
  return `test-firebase:${btoa(
    JSON.stringify({ uid: `test-${email}`, email, emailVerified: true }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")}`;
}
