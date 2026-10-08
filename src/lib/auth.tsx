import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AuthProviderName = "email" | "instagram" | "whatsapp";

export type SessionUser = {
  name: string;
  email: string;
  provider: AuthProviderName;
};

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
};

const STORAGE_KEY = "banjg.session.v1";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      setUser(saved ? (JSON.parse(saved) as SessionUser) : null);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn: (nextUser) => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      signOut: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
