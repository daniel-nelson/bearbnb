import { useEffect, useState, type FormEvent } from "react";
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
  getGuestPlace,
  getCurrentUser,
  listGuestPlaces,
  type CurrentUser,
  type GuestPlaceDetail,
  type GuestPlaceSummary,
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
      return;
    }

    await signOut(auth);
  }

  async function signInWithTestToken(email: string) {
    const user = await getCurrentUser(testAuthToken(email));
    setCurrentUser(user);
    setAuthState("signed-in");
    setNoticeMessage(null);
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
                onClick={() => void signInWithTestToken(email)}
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
          <Route path="/places/:placeId" element={<PlaceDetail />} />
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

function PlaceDetail() {
  const { placeId } = useParams();
  const [place, setPlace] = useState<GuestPlaceDetail | null>(null);
  const [detailState, setDetailState] = useState<
    "loading" | "loaded" | "failed"
  >("loading");

  useEffect(() => {
    if (!placeId) return;

    let active = true;

    getGuestPlace(placeId)
      .then((place) => {
        if (!active) return;
        setPlace(place);
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
        </article>
      )}
    </section>
  );
}

function testAuthToken(email: string) {
  return `test-firebase:${btoa(
    JSON.stringify({ uid: `test-${email}`, email, emailVerified: true }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")}`;
}
