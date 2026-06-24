import { useState } from "react";
import { useAuth } from "../lib/authContext";

// Accept-terms gate. Raised when an authenticated guest tries a consequential
// action (book, favorite, review) without having accepted the current terms.
// Accepting records consent through the sign-up endpoint, after which the guest
// can retry the action that was blocked.
export function ConsentGate() {
  const { consentRequired, acceptConsent, dismissConsent } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!consentRequired) return null;

  async function accept() {
    setSubmitting(true);
    setError("");
    try {
      await acceptConsent();
    } catch {
      setError("We could not record your acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      aria-labelledby="consent-gate-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,16,0.45)] p-4"
      data-testid="consent-gate"
      role="dialog"
    >
      <div className="w-full max-w-md border border-[#d9d9d2] bg-white p-6 shadow-[0_24px_80px_rgba(25,25,20,0.18)]">
        <h2
          className="text-2xl font-semibold tracking-normal text-[#151516]"
          id="consent-gate-title"
        >
          Accept the terms to continue
        </h2>
        <p className="mt-4 text-base leading-7 text-[#5f5f58]">
          Booking, saving, and reviewing places require agreeing to the BearBnB
          terms of service. Accept to keep going — you can browse without an
          account at any time.
        </p>

        {error && (
          <p
            className="mt-4 border border-[#f0c9c9] bg-[#fff7f7] px-3 py-2 text-sm text-[#9a2d2d]"
            data-testid="consent-gate-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            className="h-11 px-4 text-sm font-semibold text-[#696962] transition hover:text-[#18181a]"
            data-testid="consent-gate-dismiss"
            disabled={submitting}
            onClick={dismissConsent}
            type="button"
          >
            Not now
          </button>
          <button
            className="h-11 bg-[#1d1d1f] px-4 text-sm font-semibold text-white transition hover:bg-[#333336] disabled:cursor-not-allowed disabled:bg-[#9a9a93]"
            data-testid="consent-gate-accept"
            disabled={submitting}
            onClick={() => void accept()}
            type="button"
          >
            {submitting ? "Saving..." : "Accept terms"}
          </button>
        </div>
      </div>
    </div>
  );
}
