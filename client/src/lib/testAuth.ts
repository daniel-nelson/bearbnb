import { setBackendBearerToken } from "./backendAuth";

export function setTestAuth({
  uid,
  email,
  emailVerified = true,
}: {
  uid: string;
  email: string;
  emailVerified?: boolean;
}) {
  const token = testFirebaseToken({ uid, email, emailVerified });
  setBackendBearerToken(token);
  return token;
}

function testFirebaseToken(payload: {
  uid: string;
  email: string;
  emailVerified: boolean;
}) {
  const base64 = btoa(JSON.stringify(payload));
  const base64Url = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `test-firebase:${base64Url}`;
}
