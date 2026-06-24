let backendBearerToken: string | undefined;

export function setBackendBearerToken(token: string | undefined) {
  backendBearerToken = token;
}

export function getBackendBearerToken() {
  return backendBearerToken;
}
