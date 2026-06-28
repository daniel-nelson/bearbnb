import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import { setBackendBearerToken } from "./backendAuth";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        setBackendBearerToken(await nextUser.getIdToken());
      } else {
        setBackendBearerToken(undefined);
      }
      setUser(nextUser);
      setReady(true);
    });
  }, []);

  async function signOut() {
    await firebaseSignOut(auth);
    setBackendBearerToken(undefined);
  }

  return (
    <AuthContext.Provider value={{ user, ready, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
