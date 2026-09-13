import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, loadStoredToken, setAuthToken, type LoginResponse } from './client';

interface AuthState {
  user: LoginResponse['user'] | null;
  companyId: string | null;
  role: LoginResponse['role'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const SESSION_KEY = 'braco.session';

interface StoredSession {
  user: LoginResponse['user'];
  companyId: string;
  role: LoginResponse['role'];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = loadStoredToken();
    const raw = localStorage.getItem(SESSION_KEY);
    if (token && raw) {
      setSession(JSON.parse(raw));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setAuthToken(res.accessToken);
    const s: StoredSession = { user: res.user, companyId: res.companyId, role: res.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      companyId: session?.companyId ?? null,
      role: session?.role ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      logout,
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
