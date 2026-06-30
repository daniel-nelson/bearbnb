import { getBackendBearerToken } from "../../lib/backendAuth";
import { client } from "./generated/client.gen";

const apiHost =
  import.meta.env.VITE_API_HOST ??
  (import.meta.env.VITE_PSYCHIC_ENV === "test"
    ? "http://localhost:7778"
    : "http://localhost:7777");

client.setConfig({
  auth: getBackendBearerToken,
  baseUrl: apiHost,
  credentials: "omit",
});

// A 401 from an authed call means the session the client believes it holds is no
// longer valid (the Firebase ID token expired or was revoked server-side). The
// AuthProvider registers a handler that signs the user out and routes to /auth;
// it is responsible for loop-safety (it ignores 401s raised on the /auth route
// itself, so an in-progress sign-up/sign-in is never disturbed).
let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler;
}

client.interceptors.response.use((response) => {
  if (response.status === 401) onUnauthorized?.();
  return response;
});
