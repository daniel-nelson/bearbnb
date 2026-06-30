import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";

const isTestEnv = import.meta.env.VITE_PSYCHIC_ENV === "test";

const useDemoFirebaseConfig =
  import.meta.env.VITE_PSYCHIC_ENV === "test" || import.meta.env.DEV;

const firebaseAuthEmulatorHost = import.meta.env
  .VITE_FIREBASE_AUTH_EMULATOR_HOST;

if (firebaseAuthEmulatorHost && !useDemoFirebaseConfig) {
  throw new Error(
    "VITE_FIREBASE_AUTH_EMULATOR_HOST may only be set in test or development",
  );
}

const app = initializeApp({
  apiKey: firebaseEnv("VITE_FIREBASE_API_KEY", "demo-api-key"),
  authDomain: firebaseEnv(
    "VITE_FIREBASE_AUTH_DOMAIN",
    "demo-bearbnb.firebaseapp.com",
  ),
  projectId: firebaseEnv("VITE_FIREBASE_PROJECT_ID", "demo-bearbnb"),
  appId: firebaseEnv("VITE_FIREBASE_APP_ID", "demo-app-id"),
});

export const auth = getAuth(app);

if (firebaseAuthEmulatorHost) {
  connectAuthEmulator(auth, `http://${firebaseAuthEmulatorHost}`, {
    disableWarnings: true,
  });
}

// In feature specs each example must start signed out. Firebase's default
// persistence keeps the session in IndexedDB, which the browser-reset between
// specs does not clear; in-memory persistence is dropped when the page unloads.
if (isTestEnv) {
  void setPersistence(auth, inMemoryPersistence);
}

// Strictly test-only window hooks (e.g. `window.__testSignIn`) live in a
// separate module loaded via a dynamic import gated on the build-time
// `VITE_PSYCHIC_ENV === "test"` literal. In dev/prod that condition is
// statically false, so Vite eliminates this branch and never bundles
// `./testHooks` — the prod-build guard (scripts/assert-no-test-hooks.mjs)
// enforces that the `__testSignIn` marker never ships.
if (import.meta.env.VITE_PSYCHIC_ENV === "test") {
  void import("./testHooks").then((m) => m.installTestHooks(auth));
}

function firebaseEnv(name: string, demoValue: string) {
  const value = import.meta.env[name];
  if (value) return value;
  if (useDemoFirebaseConfig) return demoValue;

  throw new Error(`Missing required Firebase config: ${name}`);
}
