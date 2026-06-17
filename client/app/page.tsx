"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type SessionResponse = {
  user?: AuthUser;
};

type PlaceSummary = {
  id: string;
  title: string;
};

type PlacesIndexResponse = {
  cursor: string | null;
  results: PlaceSummary[];
};

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [placesStatus, setPlacesStatus] = useState("Loading places...");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const response = await authFetch("/api/auth/get-session", {
        method: "GET",
      }).catch(() => null);

      if (!response?.ok) return;

      const session = (await response.json()) as SessionResponse | null;
      setUser(session?.user ?? null);
    }

    void loadSession();
  }, []);

  useEffect(() => {
    async function loadPlaces() {
      setPlacesStatus("Loading places...");

      const url = new URL("/api/guest/places", window.location.origin);
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const response = await fetch(url, {
        headers: {
          "accept-language": "en-US",
        },
      });

      if (!response.ok) {
        setPlacesStatus("Places are not available right now.");
        return;
      }

      const body = (await response.json()) as PlacesIndexResponse;
      setPlaces(body.results);
      setPlacesStatus(
        body.results.length
          ? ""
          : searchQuery
            ? "No places match that search."
            : "No places are available yet.",
      );
    }

    void loadPlaces();
  }, [searchQuery]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
  }

  async function signOut() {
    setIsSigningOut(true);

    try {
      await authFetch("/api/auth/sign-out", {
        body: JSON.stringify({}),
        method: "POST",
      });
      setUser(null);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#1d1d1f]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#deded8] pb-5">
          <Link
            className="-mx-2 flex min-h-11 items-center gap-2 px-2 text-lg font-semibold tracking-normal"
            href="/"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="h-9 w-9"
              height={36}
              src="/bearbnb-logo.svg"
              width={36}
            />
            <span>BearBnB</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="sr-only">Signed in as {user.name}</span>
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#d8d8d2] bg-white text-sm font-semibold text-[#1d1d1f]"
              >
                {initialsFor(user.name)}
              </span>
              <button
                aria-label="Sign out"
                className="grid h-11 w-11 place-items-center border border-[#d8d8d2] bg-white text-[#4f4f4a] transition hover:border-[#b9b9b1] hover:text-[#18181a] disabled:cursor-not-allowed disabled:bg-[#f0f0ec]"
                disabled={isSigningOut}
                onClick={signOut}
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
          ) : (
            <Link
              className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
              href="/auth"
            >
              Sign in
            </Link>
          )}
        </header>

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
                type="submit"
              >
                Search
              </button>
            </form>
          </div>

          {placesStatus ? (
            <p className="border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]">
              {placesStatus}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <Link
                  className="block border border-[#deded8] bg-white p-3 transition hover:border-[#b9b9b1] focus-visible:border-[#1d1d1f] focus-visible:outline-none sm:p-4"
                  href={`/places/${place.id}`}
                  key={place.id}
                >
                  <p className="text-lg font-semibold text-[#171719]">
                    {place.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function initialsFor(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "G";
}

function authFetch(path: string, init: RequestInit) {
  return fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...init,
  });
}
