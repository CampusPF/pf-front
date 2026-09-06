"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as authService from "@/services/auth/auth.service";
import { getStoredUser, isLoggedIn } from "@/services/auth/token-storage";
import type { LoginPayload, RegisterPayload, User } from "@/services/auth/auth.types";

/* Sesión vía Context (no external store como el tema) porque acá sí hay
   acciones async con estados intermedios (login/register/logout) que un
   componente necesita poder esperar, no sólo un valor para leer.

   isLoading arranca en true y sólo se resuelve en el cliente: en SSR
   `localStorage` no existe, así que si hidratáramos el estado en el primer
   render (server y cliente) tendríamos mismatch de hidratación cuando ya hay
   sesión guardada. Se resuelve real en el useEffect de abajo. */

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogleToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth tiene que usarse adentro de <AuthProvider>");
  }

  return value;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(isLoggedIn() ? getStoredUser() : null);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await authService.login(payload);
    setUser(session.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const session = await authService.register(payload);
    setUser(session.user);
  }, []);

  /* Login con Google: el back ya validó contra Google y nos redirigió con el
     token. Lo cambiamos por la sesión completa (token + user vía /users/me). */
  const loginWithGoogleToken = useCallback(async (token: string) => {
    const session = await authService.completeGoogleLogin(token);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !isLoading && user !== null,
      isLoading,
      login,
      register,
      loginWithGoogleToken,
      logout,
    }),
    [user, isLoading, login, register, loginWithGoogleToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
