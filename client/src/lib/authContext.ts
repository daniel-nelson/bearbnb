import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export type AuthContextValue = {
  user: User | null;
  ready: boolean;
  signOut: () => Promise<void>;
  // True when an authed call was refused because the user has not accepted the
  // current terms of service. Drives the accept-terms gate.
  consentRequired: boolean;
  // Record terms-of-service consent for the signed-in user, then clear the gate.
  acceptConsent: () => Promise<void>;
  // Dismiss the gate without accepting (the next blocked action re-raises it).
  dismissConsent: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an <AuthProvider>.");
  return context;
}

export function displayNameFor(user: User) {
  return user.displayName?.trim() || user.email || "Guest";
}

export function initialsFor(user: User) {
  const initials = displayNameFor(user)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "G";
}
