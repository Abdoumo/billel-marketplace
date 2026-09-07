import { useState, useEffect, useCallback } from "react";

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

const TOKEN_KEY = "assethub_access_token";
const USER_KEY = "assethub_user";

function getStoredAuth(): { user: AuthUser | null; accessToken: string | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
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

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function useAuth() {
  const stored = getStoredAuth();
  const [state, setState] = useState<AuthState>({
    user: stored.user,
    accessToken: stored.accessToken,
    isAuthenticated: !!stored.accessToken,
    isLoading: false,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }

        const user: AuthUser = data.user;
        setStoredAuth(user, data.accessToken);
        setState({
          user,
          accessToken: data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true, user };
      } catch (error: any) {
        setState((s) => ({ ...s, isLoading: false }));
        return { success: false, error: error.message };
      }
    },
    []
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    }) => {
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
        setState({
          user,
          accessToken: responseData.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true, user };
      } catch (error: any) {
        setState((s) => ({ ...s, isLoading: false }));
        return { success: false, error: error.message };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    clearStoredAuth();
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const fetchMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setStoredAuth(user, token);
        setState({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        clearStoredAuth();
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      // Keep existing state on network error
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    fetchMe,
  };
}
