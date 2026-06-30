import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getV1VisitorPlaces } from "../api/backend/generated";
import type { PlaceSummaryForVisitors } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { FavoriteToggle } from "../components/FavoriteToggle";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth, initialsFor, displayNameFor } from "../lib/authContext";
import type { User } from "firebase/auth";

type PlacesIndexResponse = {
  cursor: string | null;
  results: PlaceSummaryForVisitors[];
};

export default function Home() {
  const { user, ready } = useAuth();
  const authUid = user?.uid ?? null;
  const [places, setPlaces] = useState<PlaceSummaryForVisitors[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [placesStatus, setPlacesStatus] = useState("Loading places...");
  const [paginationStatus, setPaginationStatus] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const requestPlaces = useCallback(
    async (cursor: string | null = null): Promise<PlacesIndexResponse | null> => {
      const { data, error } = await getV1VisitorPlaces({
        query: {
          ...(searchQuery ? { q: searchQuery } : {}),
          ...(cursor ? { cursor } : {}),
        },
      });

      if (error || !data) return null;

      return data;
    },
    [searchQuery],
  );

  const applyFirstPage = useCallback(
    (body: PlacesIndexResponse | null) => {
      if (!body) {
        setPlacesStatus("Places are not available right now.");
        return;
      }

      setPlaces(body.results);
      setNextCursor(body.cursor);
      setPaginationStatus("");
      setPlacesStatus(
        body.results.length
          ? ""
          : searchQuery
            ? "No places match that search."
            : "No places are available yet.",
      );
    },
    [searchQuery],
  );

  // Wait for Firebase auth to resolve before the first fetch, and refetch when
  // the signed-in guest changes. The backend scopes `favorited`/`favoriteId` to
  // the current guest via the bearer token; fetching before the token is set (or
  // not refetching when a guest signs in while this page is mounted) would leave
  // those fields stale. `AuthProvider` sets the bearer before it exposes the new
  // `user`, so by the time `authUid` changes here the token is already current.
  useEffect(() => {
    if (!ready) return;

    let active = true;

    void requestPlaces().then((body) => {
      if (active) applyFirstPage(body);
    });

    return () => {
      active = false;
    };
  }, [ready, authUid, requestPlaces, applyFirstPage]);

  async function reloadFirstPage() {
    applyFirstPage(await requestPlaces());
  }

  async function loadMorePlaces() {
    if (!nextCursor) return;

    setIsLoadingMore(true);
    setPaginationStatus("");

    try {
      const body = await requestPlaces(nextCursor);

      if (!body) {
        setPaginationStatus("More places are not available right now.");
        return;
      }

      setPlaces((currentPlaces) => [...currentPlaces, ...body.results]);
      setNextCursor(body.cursor);
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearchQuery = searchInput.trim();
    setNextCursor(null);
    setPaginationStatus("");
    setPlaces([]);
    setPlacesStatus("Loading places...");

    if (nextSearchQuery === searchQuery) {
      void reloadFirstPage();
    } else {
      setSearchQuery(nextSearchQuery);
    }
  }

  function clearSearch() {
    setSearchInput("");
    setNextCursor(null);
    setPaginationStatus("");
    setPlaces([]);
    setPlacesStatus("Loading places...");

    if (searchQuery) {
      setSearchQuery("");
    } else {
      void reloadFirstPage();
    }
  }

  return (
    <AppShell>
      <SiteHeader
        right={
          user ? (
            <SignedInControls user={user} />
          ) : (
            <Link
              className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
              data-testid="header-sign-in"
              to="/auth"
            >
              Sign in
            </Link>
          )
        }
      />

      <section className="py-8">
        <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-[#111113]">
              Available places
            </h1>
          </div>
          <form className="flex gap-2" onSubmit={handleSearch}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Search places</span>
              <input
                className="h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition placeholder:text-[#9b9b94] focus:border-[#1d1d1f]"
                data-testid="place-search"
                name="place-search"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search places"
                type="search"
                value={searchInput}
              />
            </label>
            {searchQuery && (
              <button
                className="h-11 border border-[#d9d9d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
                onClick={clearSearch}
                type="button"
              >
                Clear
              </button>
            )}
            <button
              className="h-11 bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336]"
              data-testid="place-search-submit"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>

        {placesStatus ? (
          <p
            className="border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
            data-testid="home-status"
          >
            {placesStatus}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <div
                  className="flex flex-col border border-[#deded8] bg-white transition hover:border-[#b9b9b1]"
                  key={place.id}
                >
                  <Link
                    className="block flex-1 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1d1d1f] sm:p-4"
                    to={`/places/${place.id}`}
                  >
                    <p className="break-words text-lg font-semibold text-[#171719]">
                      {place.title}
                    </p>
                  </Link>
                  {user && (
                    <div className="border-t border-[#deded8] p-3 sm:px-4">
                      <FavoriteToggle
                        place={place}
                        onChange={(next) =>
                          setPlaces((current) =>
                            current.map((entry) =>
                              entry.id === place.id
                                ? { ...entry, ...next }
                                : entry,
                            ),
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {(nextCursor || paginationStatus) && (
              <div className="mt-5 flex flex-col items-center gap-3 border-t border-[#deded8] pt-5">
                {paginationStatus && (
                  <p className="text-sm text-[#62625c]">{paginationStatus}</p>
                )}
                {nextCursor && (
                  <button
                    className="h-11 border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a] disabled:cursor-not-allowed disabled:bg-[#f0f0ec] disabled:text-[#8a8a84]"
                    data-testid="places-load-more"
                    disabled={isLoadingMore}
                    onClick={() => void loadMorePlaces()}
                    type="button"
                  >
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}

function SignedInControls({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">Signed in as {displayNameFor(user)}</span>
      <span
        aria-hidden="true"
        className="grid h-11 w-11 place-items-center rounded-full border border-[#d8d8d2] bg-white text-sm font-semibold text-[#1d1d1f]"
        data-testid="header-avatar"
      >
        {initialsFor(user)}
      </span>
      <button
        aria-label="Sign out"
        className="grid h-11 w-11 place-items-center border border-[#d8d8d2] bg-white text-[#4f4f4a] transition hover:border-[#b9b9b1] hover:text-[#18181a] disabled:cursor-not-allowed disabled:bg-[#f0f0ec]"
        data-testid="header-sign-out"
        disabled={isSigningOut}
        onClick={() => void handleSignOut()}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        <span className="sr-only">Sign out</span>
      </button>
    </div>
  );
}
