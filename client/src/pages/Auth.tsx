import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../lib/firebase";
import { setBackendBearerToken } from "../lib/backendAuth";
import { useAuth } from "../lib/authContext";
import { getV1Me, postV1SignUp } from "../api/backend/generated";
import { AppShell } from "../components/AppShell";
import { SiteHeader } from "../components/SiteHeader";

type AuthMode = "signup" | "signin";

export default function Auth() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [status, setStatus] = useState("Ready when you are.");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect visitors who are already signed in, but never while a sign-up or
    // sign-in submission is in flight: navigating away mid-request aborts the
    // backend sign-up call before it can record consent.
    if (ready && user && !isSubmitting) navigate("/", { replace: true });
  }, [navigate, ready, user, isSubmitting]);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("signup-name") ?? "").trim();
    const email = String(formData.get("signup-email") ?? "");
    const password = String(formData.get("signup-password") ?? "");

    if (formData.get("accept-terms") !== "on") {
      setError("Please accept the terms of service to create an account.");
      return;
    }

    await runAuth(async () => {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (name) await updateProfile(credential.user, { displayName: name });

      const token = await credential.user.getIdToken(true);
      setBackendBearerToken(token);
      await postV1SignUp({ throwOnError: true });

      setStatus(`Signed in as ${name || email}`);
      navigate("/");
    });
  }

  async function handleSignin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("signin-email") ?? "");
    const password = String(formData.get("signin-password") ?? "");

    await runAuth(async () => {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const token = await credential.user.getIdToken();
      setBackendBearerToken(token);
      await getV1Me({ throwOnError: true });

      setStatus("Welcome back.");
      navigate("/");
    });
  }

  async function runAuth(submit: () => Promise<void>) {
    setIsSubmitting(true);
    setError("");

    try {
      await submit();
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <SiteHeader
        right={
          <Link
            className="flex min-h-11 items-center border border-[#d8d8d2] bg-white px-4 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a]"
            to="/"
          >
            Browse places
          </Link>
        }
      />

      <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10 lg:py-14">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.14em] text-[#707069]">
            Guest access
          </p>
          <h1 className="text-4xl font-semibold leading-[1.04] tracking-normal text-[#111113] sm:text-6xl">
            Sign in when you are ready.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5f5f58]">
            Browse places without an account. Create one when you want to book,
            review, or come back to the same session.
          </p>
        </div>

        <section
          aria-label="Guest authentication"
          className="order-first w-full border border-[#d9d9d2] bg-white p-5 shadow-[0_24px_80px_rgba(25,25,20,0.08)] sm:p-6 lg:order-none"
        >
          <div className="mb-6">
            <p className="text-sm font-medium text-[#707069]" data-testid="auth-status">
              {status}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#151516]">
              {mode === "signup" ? "Create account" : "Welcome back"}
            </h2>
          </div>

          <div className="mb-5 grid grid-cols-2 border border-[#e1e1dc] bg-[#f8f8f5] p-1">
            <button
              className={modeButtonClass(mode === "signup")}
              data-testid="auth-tab-signup"
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
              data-testid="auth-tab-signin"
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
              showTerms
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
            <p
              className="mt-4 border border-[#f0c9c9] bg-[#fff7f7] px-3 py-2 text-sm text-[#9a2d2d]"
              data-testid="auth-error"
              role="alert"
            >
              {error}
            </p>
          )}
        </section>
      </section>
    </AppShell>
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
  showTerms = false,
}: {
  buttonLabel: string;
  emailName: string;
  isSubmitting: boolean;
  nameName?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  passwordName: string;
  showName?: boolean;
  showTerms?: boolean;
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
      {showTerms && (
        <label className="flex items-start gap-3 text-sm text-[#4f4f4a]">
          <input
            className="mt-0.5 h-4 w-4 border border-[#d9d9d2] accent-[#1d1d1f]"
            data-testid="auth-accept-terms"
            name="accept-terms"
            type="checkbox"
          />
          <span>
            I agree to the BearBnB terms of service and acknowledge the privacy
            policy.
          </span>
        </label>
      )}
      <button
        className="h-11 w-full bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
        data-testid="auth-submit"
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
    "h-11 text-sm font-semibold transition",
    isActive
      ? "bg-white text-[#18181a] shadow-sm"
      : "text-[#696962] hover:text-[#18181a]",
  ].join(" ");
}

function authErrorMessage(caught: unknown) {
  if (caught instanceof FirebaseError) {
    switch (caught.code) {
      case "auth/email-already-in-use":
        return "That email already has an account. Try signing in instead.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Choose a password with at least 8 characters.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "That email and password did not match.";
      default:
        return "We could not complete that request. Please try again.";
    }
  }

  return "We could not complete that request. Please try again.";
}
