"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthMode = "signup" | "signin";

type SessionResponse = {
  user?: AuthUser;
};

type ErrorResponse = {
  message?: string;
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
  const [mode, setMode] = useState<AuthMode>("signup");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [status, setStatus] = useState("Checking your session...");
  const [error, setError] = useState("");
  const [placesStatus, setPlacesStatus] = useState("Loading places...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await authFetch("/api/auth/get-session", {
          method: "GET",
        });

        if (!response.ok) {
          setStatus("Ready when you are.");
          return;
        }

        const session = (await response.json()) as SessionResponse | null;
        if (session?.user) {
          setUser(session.user);
          setStatus(`Signed in as ${session.user.name}`);
        } else {
          setStatus("Ready when you are.");
        }
      } catch {
        setStatus("Ready when you are.");
      }
    }

    void loadSession();
  }, []);

  useEffect(() => {
    async function loadPlaces() {
      const response = await fetch("/api/guest/places", {
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
      setPlacesStatus(body.results.length ? "" : "No places are available yet.");
    }

    void loadPlaces();
  }, []);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submitAuth("/api/auth/sign-up/email", {
      name: String(formData.get("signup-name") ?? ""),
      email: String(formData.get("signup-email") ?? ""),
      password: String(formData.get("signup-password") ?? ""),
    });
  }

  async function handleSignin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submitAuth("/api/auth/sign-in/email", {
      email: String(formData.get("signin-email") ?? ""),
      password: String(formData.get("signin-password") ?? ""),
    });
  }

  async function submitAuth(path: string, body: Record<string, string>) {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await authFetch(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const responseBody = (await response.json().catch(() => null)) as
        | SessionResponse
        | ErrorResponse
        | null;

      if (!response.ok || !isSessionResponse(responseBody)) {
        setError(
          (isErrorResponse(responseBody) && responseBody.message) ||
            "We could not complete that request.",
        );
        return;
      }

      setUser(responseBody.user ?? null);
      setStatus(`Signed in as ${responseBody.user?.name ?? "your account"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    setIsSubmitting(true);
    setError("");

    try {
      await authFetch("/api/auth/sign-out", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setUser(null);
      setMode("signin");
      setStatus("Welcome back");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#1d1d1f]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#deded8] pb-5">
          <Link className="text-lg font-semibold tracking-normal" href="/">
            BearBnB
          </Link>
          <span className="rounded-full border border-[#d8d8d2] bg-white px-3 py-1 text-sm text-[#62625c]">
            Guest preview
          </span>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10 lg:py-14">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
              Guest access
            </p>
            <h1 className="text-4xl font-semibold leading-[1.04] tracking-normal text-[#111113] sm:text-6xl">
              Find your next place.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5f5f58]">
              Start with a simple guest account. Save your session today, then
              come back with the same email and password.
            </p>
          </div>

          <section
            aria-label="Guest authentication"
            className="order-first w-full border border-[#d9d9d2] bg-white p-5 shadow-[0_24px_80px_rgba(25,25,20,0.08)] sm:p-6 lg:order-none"
          >
            <div className="mb-6">
              <p className="text-sm font-medium text-[#707069]">{status}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#151516]">
                {user
                  ? "Your guest account"
                  : mode === "signup"
                    ? "Create account"
                    : "Welcome back"}
              </h2>
            </div>

            {user ? (
              <div className="space-y-5">
                <div className="border border-[#e4e4de] bg-[#fafaf8] p-4">
                  <p className="text-sm font-medium text-[#707069]">
                    Signed in as
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#161617]">
                    {user.name}
                  </p>
                  <p className="mt-1 text-sm text-[#62625c]">{user.email}</p>
                </div>
                <button
                  className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
                  disabled={isSubmitting}
                  onClick={signOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 grid grid-cols-2 border border-[#e1e1dc] bg-[#f8f8f5] p-1">
                  <button
                    className={modeButtonClass(mode === "signup")}
                    onClick={() => {
                      setError("");
                      setMode("signup");
                    }}
                    type="button"
                  >
                    New guest
                  </button>
                  <button
                    className={modeButtonClass(mode === "signin")}
                    onClick={() => {
                      setError("");
                      setMode("signin");
                    }}
                    type="button"
                  >
                    Returning
                  </button>
                </div>

                {mode === "signup" ? (
                  <AuthForm
                    buttonLabel="Create account"
                    emailName="signup-email"
                    isSubmitting={isSubmitting}
                    nameName="signup-name"
                    onSubmit={handleSignup}
                    passwordName="signup-password"
                    showName
                  />
                ) : (
                  <AuthForm
                    buttonLabel="Sign in"
                    emailName="signin-email"
                    isSubmitting={isSubmitting}
                    onSubmit={handleSignin}
                    passwordName="signin-password"
                  />
                )}

                {error && (
                  <p className="mt-4 border border-[#f0c9c9] bg-[#fff7f7] px-3 py-2 text-sm text-[#9a2d2d]">
                    {error}
                  </p>
                )}
              </>
            )}
          </section>
        </section>

        <section className="border-t border-[#deded8] py-10">
          <div className="mb-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal text-[#111113]">
                Available places
              </h2>
            </div>
          </div>

          {placesStatus ? (
            <p className="border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]">
              {placesStatus}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <article
                  className="border border-[#deded8] bg-white p-3 transition hover:border-[#b9b9b1] sm:p-4"
                  key={place.id}
                >
                  <p className="text-lg font-semibold text-[#171719]">
                    {place.title}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AuthForm({
  buttonLabel,
  emailName,
  isSubmitting,
  nameName,
  onSubmit,
  passwordName,
  showName = false,
}: {
  buttonLabel: string;
  emailName: string;
  isSubmitting: boolean;
  nameName?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  passwordName: string;
  showName?: boolean;
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {showName && nameName && (
        <Field
          autoComplete="name"
          label="Name"
          name={nameName}
          placeholder="Maple Bear"
          required
          type="text"
        />
      )}
      <Field
        autoComplete="email"
        label="Email"
        name={emailName}
        placeholder="you@example.com"
        required
        type="email"
      />
      <Field
        autoComplete={showName ? "new-password" : "current-password"}
        label="Password"
        minLength={8}
        name={passwordName}
        placeholder="At least 8 characters"
        required
        type="password"
      />
      <button
        className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Working..." : buttonLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  ...inputProps
}: {
  autoComplete: string;
  label: string;
  minLength?: number;
  name: string;
  placeholder: string;
  required?: boolean;
  type: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#4f4f4a]">{label}</span>
      <input
        className="mt-2 h-11 w-full border border-[#d9d9d2] bg-white px-3 text-base text-[#171717] outline-none transition placeholder:text-[#9b9b94] focus:border-[#1d1d1f]"
        name={name}
        {...inputProps}
      />
    </label>
  );
}

function modeButtonClass(isActive: boolean) {
  return [
    "h-10 text-sm font-semibold transition",
    isActive
      ? "bg-white text-[#18181a] shadow-sm"
      : "text-[#696962] hover:text-[#18181a]",
  ].join(" ");
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

function isSessionResponse(value: unknown): value is SessionResponse {
  return typeof value === "object" && value !== null && "user" in value;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === "object" && value !== null && "message" in value;
}
