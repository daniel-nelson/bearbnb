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

// Marker the backend returns in the body of the 403 raised when an authenticated
// user has not accepted the current terms of service. The client and api are
// separate packages with no shared code, so this literal must stay in sync with
// api `TERMS_OF_SERVICE_REQUIRED_ERROR` (api/src/conf/termsOfService.ts).
const TERMS_OF_SERVICE_REQUIRED_ERROR = "terms_of_service_required";

// A consent-required 403 means the user is authenticated but has never accepted
// the terms (provisioning does not record consent). The AuthProvider registers a
// handler that surfaces the accept-terms gate so the user can consent and retry.
let onConsentRequired: (() => void) | undefined;

export function setConsentRequiredHandler(handler: (() => void) | undefined) {
  onConsentRequired = handler;
}

client.interceptors.response.use(async (response) => {
  if (response.status === 401) {
    onUnauthorized?.();
  } else if (response.status === 403 && onConsentRequired) {
    // Read a clone so the original body stream stays intact for the caller.
    const body = await response
      .clone()
      .text()
      .catch(() => "");
    if (body.includes(TERMS_OF_SERVICE_REQUIRED_ERROR)) onConsentRequired();
  }
  return response;
});
