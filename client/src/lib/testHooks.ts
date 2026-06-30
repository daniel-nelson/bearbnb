import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type Auth,
} from "firebase/auth";

declare global {
  interface Window {
    __testSignIn?: (email: string, password: string) => Promise<unknown>;
    __testSignUpWithoutConsent?: (
      email: string,
      password: string,
    ) => Promise<unknown>;
  }
}

// Test-only affordances for feature specs.
//
// `__testSignIn` signs a guest in WITHOUT a full page navigation, so a spec can
// verify that auth-dependent data (like a place's `favorited` flag) is refetched
// when a guest signs in while a page is already mounted. A route-based sign-in
// always sets the bearer before the next page mounts, which would hide that race.
//
// `__testSignUpWithoutConsent` reproduces the provisioned-but-unconsented state:
// it creates a Firebase account (which signs the user in) but never calls the
// backend sign-up endpoint, so no terms-of-service consent is recorded. The user
// is then provisioned by the next authenticated request, leaving them blocked
// from guest actions until they accept through the consent gate.
//
// This module is only ever imported from firebase.ts behind the build-time
// `VITE_PSYCHIC_ENV === "test"` literal, so Vite drops it from dev/prod bundles
// entirely. The prod-build guard (scripts/assert-no-test-hooks.mjs) enforces
// that the `__test` markers never ship.
export function installTestHooks(auth: Auth) {
  window.__testSignIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  window.__testSignUpWithoutConsent = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);
}
