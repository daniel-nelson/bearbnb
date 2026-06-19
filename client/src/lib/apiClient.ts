type RequestOptions = {
  token?: string;
};

export class ApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type CursorPaginatedResponse<T> = {
  cursor: string | null;
  results: T[];
};

export const apiHost =
  import.meta.env.VITE_API_HOST ??
  (import.meta.env.VITE_PSYCHIC_ENV === "test"
    ? "http://localhost:7778"
    : "http://localhost:7777");

export async function getJson<T>(
  path: string,
  { token }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(new URL(path, apiHost), {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.ok) return (await response.json()) as T;

  if (response.status === 401)
    throw new ApiError("Sign in before continuing.", response.status);
  if (response.status === 404)
    throw new ApiError("The requested record was not found.", response.status);

  throw new ApiError("The API request failed.", response.status);
}

export async function checkApiHealth(): Promise<void> {
  const response = await fetch(new URL("/status", apiHost), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok)
    throw new ApiError("The API health check failed.", response.status);
}

export type CurrentUser = {
  id: string;
  email: string;
};

export async function getCurrentUser(token: string) {
  return await getJson<CurrentUser>("/v1/me", { token });
}

export type GuestPlaceSummary = {
  id: string;
  title: string;
};

export async function listGuestPlaces() {
  return await getJson<CursorPaginatedResponse<GuestPlaceSummary>>(
    "/v1/guest/places",
  );
}

export type GuestRoom =
  | {
      id: string;
      type: "Kitchen";
      displayType: string;
      title: string;
      appliances: { value: string; label: string }[];
    }
  | {
      id: string;
      type: "Bathroom";
      displayType: string;
      title: string;
      bathOrShowerStyle: { value: string; label: string } | null;
    }
  | {
      id: string;
      type: "Bedroom";
      displayType: string;
      title: string;
      bedTypes: { value: string; label: string }[];
    }
  | {
      id: string;
      type: "Den" | "LivingRoom";
      displayType: string;
      title: string;
    };

export type GuestPlaceDetail = {
  id: string;
  title: string;
  style: string;
  displayStyle: string;
  sleeps: number;
  rooms: GuestRoom[];
};

export async function getGuestPlace(id: string) {
  return await getJson<GuestPlaceDetail>(`/v1/guest/places/${id}`);
}
