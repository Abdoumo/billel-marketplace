import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified?: boolean;
  kycStatus?: string;
  isVerifiedBadge?: boolean;
  sellerScore?: number;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  register: (data: { email: string; password: string; firstName?: string; lastName?: string; role?: string }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const TOKEN_KEY = "assethub_access_token";
const USER_KEY = "assethub_user";

export function getAccessToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function getStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user: AuthUser | null = userStr ? JSON.parse(userStr) : null;
    return { user, accessToken: token };
  } catch {
    return { user: null, accessToken: null };
  }
}

function setStoredAuth(user: AuthUser, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = getStoredAuth();
  const [state, setState] = useState<AuthState>({
    user: stored.user,
    accessToken: stored.accessToken,
    isAuthenticated: !!stored.accessToken && !!stored.user,
    isLoading: false,
  });

  // Verify token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.ok) {
          const user: AuthUser = await res.json();
          setStoredAuth(user, token);
          setState({ user, accessToken: token, isAuthenticated: true, isLoading: false });
        } else {
          clearStoredAuth();
          setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      })
      .catch(() => { /* keep existing state on network error */ });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const user: AuthUser = data.user;
      setStoredAuth(user, data.accessToken);
      setState({ user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (error: any) {
      setState((s) => ({ ...s, isLoading: false }));
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (data: { email: string; password: string; firstName?: string; lastName?: string; role?: string }) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(responseData.error)
            ? responseData.error.map((e: any) => e.message).join(", ")
            : responseData.error || "Registration failed"
        );
      }
      const user: AuthUser = responseData.user;
      setStoredAuth(user, responseData.accessToken);
      setState({ user, accessToken: responseData.accessToken, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (error: any) {
      setState((s) => ({ ...s, isLoading: false }));
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    clearStoredAuth();
    setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const user: AuthUser = await res.json();
        setStoredAuth(user, token);
        setState((s) => ({ ...s, user, isAuthenticated: true }));
      }
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
