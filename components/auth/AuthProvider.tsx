"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as authService from "@/services/auth/auth.service";
import { clearSession, getStoredUser, getToken, isLoggedIn, saveSession } from "@/services/auth/token-storage";
import type { LoginPayload, RegisterPayload, User } from "@/services/auth/auth.types";

/* Sesión vía Context (no external store como el tema) porque acá sí hay
   acciones async con estados intermedios (login/register/logout) que un
   componente necesita poder esperar, no sólo un valor para leer.

   isLoading arranca en true y sólo se resuelve en el cliente: en SSR
   `localStorage` no existe, así que si hidratáramos el estado en el primer
   render (server y cliente) tendríamos mismatch de hidratación cuando ya hay
   sesión guardada. Se resuelve real en el useEffect de abajo.

   bfcache: al volver con el botón "atrás" del navegador, Chrome/Firefox no
   vuelven a ejecutar este componente desde cero — restauran el árbol de
   React tal como estaba ANTES de navegar (evento `pageshow` con
   `persisted: true`), sin correr efectos ni releer nada. Si el usuario
   inició sesión (o cerró sesión) DESPUÉS de esa foto, el estado restaurado
   queda desincronizado del localStorage/cookie reales: se ve /login
   logueado, o un dashboard cacheado después de haber cerrado sesión. Por
   eso, además del mount normal, revalidamos contra el back en cada
   `pageshow` persisted — es el único momento en que el árbol "vuelve a la
   vida" sin pasar por un mount real. */

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogleToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Vuelve a pedir GET /users/me y actualiza la sesión guardada. */
  refreshUser: () => Promise<User | null>;
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

  // Mount en dos pasos:
  //
  //   1. Chequeo local (sin red): pinta de inmediato lo que haya en
  //      localStorage y resuelve isLoading sin flicker.
  //   2. Revalidación en segundo plano contra GET /users/me.
  //
  // El paso 2 hace falta porque el user que cachea `login`/`register` sale de
  // la respuesta de esos endpoints, que trae MENOS campos que /users/me
  // (faltaba el nombre): sin esto el saludo del dashboard mostraba "Hola, de
  // nuevo" hasta que el usuario editaba el perfil o volvía con el botón
  // "atrás". De paso corrige la sesión si cambió algo en otro dispositivo o
  // si el token venció mientras la pestaña estaba cerrada.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(isLoggedIn() ? getStoredUser() : null);
    setIsLoading(false);

    if (!getToken()) return;

    authService
      .fetchCurrentUser()
      .then((freshUser) => {
        saveSession(getToken()!, freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        // 401 u otro error: el token guardado ya no sirve (expiró, se
        // revocó). No dejamos una sesión fantasma.
        clearSession();
        setUser(null);
      });
  }, []);

  // Revalidación real contra el back, para el caso bfcache (ver comentario
  // de arriba) y como bonus para cuando el token expiró (maxAge) mientras
  // la pestaña seguía abierta: localStorage.getItem no se entera de eso,
  // GET /users/me sí.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;

      setIsLoading(true);

      if (!getToken()) {
        // Sin token no hay nada que confirmar con el back: cerró sesión (o
        // nunca la inició) después de que se congelara esta foto.
        setUser(null);
        setIsLoading(false);
        return;
      }

      authService
        .fetchCurrentUser()
        .then((freshUser) => {
          // El token seguía vivo: refrescamos también el user cacheado por
          // si cambió algo (nombre, avatar) mientras tanto.
          saveSession(getToken()!, freshUser);
          setUser(freshUser);
        })
        .catch(() => {
          // 401 u otro error: el token que quedó en localStorage ya no
          // sirve (expiró, se revocó). No dejamos una sesión fantasma.
          clearSession();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
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

  /* La pantalla de configuración edita datos que se muestran en el chrome del
     dashboard (el nombre del sidebar, la inicial del avatar). Sin esto habría
     que recargar la página para verlos actualizados. Devuelve el usuario
     fresco para que quien llame pueda usarlo sin esperar al re-render. */
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return null;

    const freshUser = await authService.fetchCurrentUser();
    saveSession(token, freshUser);
    setUser(freshUser);

    return freshUser;
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
      refreshUser,
    }),
    [user, isLoading, login, register, loginWithGoogleToken, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
