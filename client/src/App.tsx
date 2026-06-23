import { useCallback, useEffect, useState, type FormEvent } from "react";
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
  createGuestFavorite,
  createGuestReview,
  deleteGuestFavorite,
  getGuestPlace,
  getGuestPlaceAvailability,
  getCurrentUser,
  listGuestPlaceReviews,
  listGuestPlaces,
  type CurrentUser,
  type GuestPlaceDetail,
  type GuestPlaceSummary,
  type GuestReview,
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
  const [placesLoadedForAuthState, setPlacesLoadedForAuthState] = useState<
    "checking" | "signed-out" | "signed-in" | null
  >(null);

  const currentAuthToken = useCallback(async () => {
    if (useTestAuth) return testToken;
    return (await auth.currentUser?.getIdToken()) ?? null;
  }, [testToken]);

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

    currentAuthToken()
      .then((token) => listGuestPlaces(token))
      .then(({ results }) => {
        if (!active) return;
        setPlaces(results);
        setPlacesState("loaded");
        setPlacesLoadedForAuthState(authState);
      })
      .catch(() => {
        if (active) setPlacesState("failed");
      });

    return () => {
      active = false;
    };
  }, [authState, currentAuthToken, currentUser]);

  useEffect(() => {
    if (useTestAuth) {
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setErrorMessage(null);
      setPlacesLoadedForAuthState(null);

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
    setPlacesLoadedForAuthState(null);

    if (useTestAuth) {
      setCurrentUser(null);
      setAuthState("signed-out");
      setTestToken(null);
      return;
    }

    await signOut(auth);
  }

  async function signInWithTestToken(email: string) {
    setPlacesLoadedForAuthState(null);
    const token = testAuthToken(email);
    const user = await getCurrentUser(token);
    setCurrentUser(user);
    setAuthState("signed-in");
    setNoticeMessage(null);
    setTestToken(token);
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
            element={
              <PlacesIndex
                authState={authState}
                currentAuthToken={currentAuthToken}
                onFavoriteChange={(updatedPlace) => {
                  setPlaces((currentPlaces) =>
                    currentPlaces.map((place) =>
                      place.id === updatedPlace.id ? updatedPlace : place,
                    ),
                  );
                }}
                places={places}
                placesLoadedForAuthState={placesLoadedForAuthState}
                placesState={placesState}
              />
            }
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
  authState,
  currentAuthToken,
  onFavoriteChange,
  places,
  placesLoadedForAuthState,
  placesState,
}: {
  authState: "checking" | "signed-out" | "signed-in";
  currentAuthToken: () => Promise<string | null>;
  onFavoriteChange: (place: GuestPlaceSummary) => void;
  places: GuestPlaceSummary[];
  placesLoadedForAuthState: "checking" | "signed-out" | "signed-in" | null;
  placesState: "loading" | "loaded" | "failed";
}) {
  const [pendingFavoritePlaceId, setPendingFavoritePlaceId] = useState<string | null>(null);
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);
  const signedInPlacesLoaded = authState === "signed-in" && placesLoadedForAuthState === "signed-in";

  async function toggleFavorite(place: GuestPlaceSummary) {
    const token = await currentAuthToken();
    if (!token) {
      setFavoriteMessage("Sign in before saving favorite places.");
      return;
    }

    setPendingFavoritePlaceId(place.id);
    setFavoriteMessage(null);
    try {
      if (place.favorited) {
        if (!place.favoriteId) {
          setFavoriteMessage("Favorite could not be updated.");
          return;
        }
        await deleteGuestFavorite({ favoriteId: place.favoriteId, token });
        onFavoriteChange({ ...place, favoriteId: null, favorited: false });
      } else {
        const favorite = await createGuestFavorite({ placeId: place.id, token });
        onFavoriteChange({ ...place, favoriteId: favorite.id, favorited: true });
      }
    } catch (error) {
      setFavoriteMessage(error instanceof Error ? error.message : "Favorite could not be updated.");
    } finally {
      setPendingFavoritePlaceId(null);
    }
  }

  return (
    <section className="places-section" aria-labelledby="places-heading">
      <div className="section-header">
        <div>
          <span className="eyebrow">Stay search</span>
          <h2 id="places-heading">Available places</h2>
        </div>
        <span className="result-count">{places.length} listed</span>
      </div>
      {favoriteMessage ? (
        <p className="form-error" role="alert">
          {favoriteMessage}
        </p>
      ) : null}

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
            <li className="place-row" key={place.id}>
              <Link className="place-link" to={`/places/${place.id}`}>
                <span>{place.title}</span>
                <span aria-hidden="true">View</span>
              </Link>
              {signedInPlacesLoaded ? (
                <button
                  aria-pressed={place.favorited}
                  className="favorite-toggle"
                  data-testid={`favorite-toggle-${place.id}`}
                  disabled={pendingFavoritePlaceId === place.id}
                  onClick={() => void toggleFavorite(place)}
                  type="button"
                >
                  {place.favorited ? "Saved" : "Save"}
                </button>
              ) : null}
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
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [reviewState, setReviewState] = useState<
    "idle" | "submitting" | "created" | "failed"
  >("idle");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [recentBookingId, setRecentBookingId] = useState<string | null>(null);
  const [calendarSelectionStep, setCalendarSelectionStep] = useState<
    "start" | "end"
  >("start");

  useEffect(() => {
    if (!placeId) return;

    let active = true;

    Promise.all([
      getGuestPlace(placeId),
      getGuestPlaceAvailability(placeId),
      listGuestPlaceReviews(placeId),
    ])
      .then(([place, availability, reviews]) => {
        if (!active) return;
        setPlace(place);
        setOccupiedRanges(availability.occupiedRanges);
        setReviews(reviews.results);
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
                const booking = await createGuestBooking({
                  placeId,
                  startsOn: submittedStartsOn,
                  endsOn: submittedEndsOn,
                  token,
                });
                setOccupiedRanges((currentRanges) => [
                  ...currentRanges,
                  { startsOn: submittedStartsOn, endsOn: submittedEndsOn },
                ]);
                setRecentBookingId(booking.id);
                setReviewState("idle");
                setReviewMessage(null);
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

          {recentBookingId ? (
            <ReviewForm
              onSubmit={async (event) => {
                event.preventDefault();
                setReviewMessage(null);
                const form = event.currentTarget;

                const token = await currentAuthToken();
                if (!token) {
                  setReviewState("failed");
                  setReviewMessage("Sign in before reviewing this stay.");
                  return;
                }

                const formData = new FormData(form);
                const rating = Number(formData.get("rating"));
                const body = String(formData.get("body") ?? "");
                if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !body.trim()) {
                  setReviewState("failed");
                  setReviewMessage("Choose a rating and write a review.");
                  return;
                }

                setReviewState("submitting");
                try {
                  const review = await createGuestReview({
                    bookingId: recentBookingId,
                    rating,
                    body,
                    token,
                  });
                  setReviews((currentReviews) => [review, ...currentReviews]);
                  setReviewState("created");
                  setReviewMessage("Review posted.");
                  form.reset();
                } catch (error) {
                  setReviewState("failed");
                  setReviewMessage(
                    error instanceof Error
                      ? error.message
                      : "Review could not be posted.",
                  );
                }
              }}
              reviewMessage={reviewMessage}
              reviewState={reviewState}
            />
          ) : null}

          <ReviewsList reviews={reviews} />
        </article>
      )}
    </section>
  );
}

function ReviewForm({
  onSubmit,
  reviewMessage,
  reviewState,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  reviewMessage: string | null;
  reviewState: "idle" | "submitting" | "created" | "failed";
}) {
  return (
    <section aria-labelledby="review-form-heading">
      <h3 id="review-form-heading">Review this stay</h3>
      <form className="review-form" onSubmit={onSubmit}>
        <label>
          Rating
          <select
            data-testid="review-rating"
            disabled={reviewState === "created"}
            name="rating"
            defaultValue="5"
          >
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </label>
        <label>
          Review
          <textarea
            data-testid="review-body"
            disabled={reviewState === "created"}
            name="body"
            rows={3}
          />
        </label>
        {reviewMessage ? (
          <p
            className={reviewState === "created" ? "form-notice" : "form-error"}
            role={reviewState === "failed" ? "alert" : undefined}
          >
            {reviewMessage}
          </p>
        ) : null}
        <button
          className="primary-action"
          data-testid="review-submit"
          disabled={reviewState === "submitting" || reviewState === "created"}
          type="submit"
        >
          {reviewState === "submitting" ? "Posting..." : "Post review"}
        </button>
      </form>
    </section>
  );
}

function ReviewsList({ reviews }: { reviews: GuestReview[] }) {
  return (
    <section aria-labelledby="reviews-heading">
      <div className="subsection-header">
        <h3 id="reviews-heading">Guest reviews</h3>
        <span className="result-count">{reviews.length} posted</span>
      </div>
      {reviews.length === 0 ? (
        <p className="inline-state">No guest reviews yet.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <span>{review.rating}/5</span>
              <p>{review.body}</p>
            </li>
          ))}
        </ul>
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
