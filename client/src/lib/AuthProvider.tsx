import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { setBackendBearerToken } from "./backendAuth";
import {
  setConsentRequiredHandler,
  setUnauthorizedHandler,
} from "../api/backend/client";
import { postV1SignUp } from "../api/backend/generated";
import { AuthContext } from "./authContext";
import { ConsentGate } from "../components/ConsentGate";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [ready, setReady] = useState(false);
  const [consentRequired, setConsentRequired] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        setBackendBearerToken(await nextUser.getIdToken());
      } else {
        setBackendBearerToken(undefined);
        // A signed-out user can never be consent-blocked; clear any stale gate.
        setConsentRequired(false);
      }
      setUser(nextUser);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    // Treat a 401 from an authed call as a dead session: sign out and route to
    // /auth. Loop-safety: skip when the rejected call came from the /auth route
    // itself (an in-progress sign-up/sign-in surfaces its own error there), and
    // skip when no session was held (an unauthenticated visitor browsing public
    // pages must not be bounced to /auth). The `auth.currentUser` check scopes
    // this to "was authenticated, now rejected"; after signOut it is null, so
    // parallel in-flight 401s are no-ops rather than repeated redirects.
    setUnauthorizedHandler(() => {
      if (window.location.pathname.startsWith("/auth")) return;
      if (!auth.currentUser) return;
      void signOut().then(() => navigate("/auth", { replace: true }));
    });
    return () => setUnauthorizedHandler(undefined);
  }, [navigate]);

  useEffect(() => {
    // A consent-required 403 means the user is authenticated but has not accepted
    // the current terms. Raise the accept-terms gate; ignore when no session is
    // held so a stray 403 cannot trap a signed-out visitor.
    setConsentRequiredHandler(() => {
      if (!auth.currentUser) return;
      setConsentRequired(true);
    });
    return () => setConsentRequiredHandler(undefined);
  }, []);

  async function signOut() {
    await firebaseSignOut(auth);
    setBackendBearerToken(undefined);
  }

  async function acceptConsent() {
    await postV1SignUp({ throwOnError: true });
    setConsentRequired(false);
  }

  function dismissConsent() {
    setConsentRequired(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        signOut,
        consentRequired,
        acceptConsent,
        dismissConsent,
      }}
    >
      {children}
      <ConsentGate />
    </AuthContext.Provider>
  );
}
