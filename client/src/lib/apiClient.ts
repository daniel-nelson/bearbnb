type RequestOptions = {
  token?: string;
  badRequestMessage?: string;
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

export async function postJson<T>(
  path: string,
  body: unknown,
  { badRequestMessage = "The submitted data is invalid.", token }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(new URL(path, apiHost), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (response.ok) return (await response.json()) as T;

  if (response.status === 400) throw new ApiError(badRequestMessage, response.status);
  if (response.status === 401)
    throw new ApiError("Sign in before continuing.", response.status);
  if (response.status === 404)
    throw new ApiError("The requested record was not found.", response.status);

  throw new ApiError("The API request failed.", response.status);
}

export async function deleteJson(
  path: string,
  { token }: RequestOptions = {},
): Promise<void> {
  const response = await fetch(new URL(path, apiHost), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.ok) return;

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
  favoriteId: string | null;
  favorited: boolean;
  id: string;
  title: string;
};

export async function listGuestPlaces(token?: string | null) {
  return await getJson<CursorPaginatedResponse<GuestPlaceSummary>>(
    "/v1/guest/places",
    { token: token ?? undefined },
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

export type OccupiedRange = {
  startsOn: string;
  endsOn: string;
};

export type GuestPlaceAvailability = {
  occupiedRanges: OccupiedRange[];
};

export async function getGuestPlaceAvailability(id: string) {
  return await getJson<GuestPlaceAvailability>(
    `/v1/guest/places/${id}/availability`,
  );
}

export type GuestReview = {
  id: string;
  rating: number;
  body: string;
};

export async function listGuestPlaceReviews(id: string) {
  return await getJson<CursorPaginatedResponse<GuestReview>>(
    `/v1/guest/places/${id}/reviews`,
  );
}

export type GuestBooking = {
  id: string;
  startsOn: string;
  endsOn: string;
};

export async function createGuestBooking({
  placeId,
  startsOn,
  endsOn,
  token,
}: {
  placeId: string;
  startsOn: string;
  endsOn: string;
  token: string;
}) {
  return await postJson<GuestBooking>(
    "/v1/guest/bookings",
    { placeId, startsOn, endsOn },
    { token, badRequestMessage: "Those dates are not available." },
  );
}

export async function createGuestReview({
  bookingId,
  rating,
  body,
  token,
}: {
  bookingId: string;
  rating: number;
  body: string;
  token: string;
}) {
  return await postJson<GuestReview>(
    "/v1/guest/reviews",
    { bookingId, rating, body },
    { token, badRequestMessage: "That review could not be posted." },
  );
}

export type GuestFavorite = {
  id: string;
  placeId: string;
};

export async function createGuestFavorite({
  placeId,
  token,
}: {
  placeId: string;
  token: string;
}) {
  return await postJson<GuestFavorite>(
    "/v1/guest/favorites",
    { placeId },
    { token },
  );
}

export async function deleteGuestFavorite({
  favoriteId,
  token,
}: {
  favoriteId: string;
  token: string;
}) {
  await deleteJson(`/v1/guest/favorites/${favoriteId}`, { token });
}
