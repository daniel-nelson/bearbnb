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
  getCurrentUser,
  type CurrentUser,
} from "./lib/apiClient";
import { auth } from "./lib/firebase";
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
    </main>
  );
}

export default App;

function testAuthToken(email: string) {
  return `test-firebase:${btoa(
    JSON.stringify({ uid: `test-${email}`, email, emailVerified: true }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")}`;
}
