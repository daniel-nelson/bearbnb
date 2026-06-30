import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth, initialsFor, displayNameFor } from "../lib/authContext";
import type { User } from "firebase/auth";

export default function Home() {
  const { user } = useAuth();

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
        <h1 className="text-3xl font-semibold tracking-normal text-[#111113]">
          Available places
        </h1>
        <p
          className="mt-6 border border-[#deded8] bg-white px-4 py-5 text-sm text-[#62625c]"
          data-testid="home-status"
        >
          Place browsing is coming soon.
        </p>
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
