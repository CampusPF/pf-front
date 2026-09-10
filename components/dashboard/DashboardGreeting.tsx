"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardGreeting() {
  const { user, isLoading } = useAuth();

  return (
    <header className="mb-6">
      <h1 className="text-text text-2xl font-bold md:text-3xl">
        {isLoading ? (
          // Evita el parpadeo de "Hola, undefined" mientras se resuelve la sesión
          <span
            className="bg-surface-elevated inline-block h-8 w-48 animate-pulse rounded-lg align-middle"
            aria-hidden
          />
        ) : (
          <>
            Hola, {user?.name ?? "de nuevo"} <span aria-hidden>👋</span>
          </>
        )}
      </h1>
      <p className="text-text-secondary mt-1">
        Continuá aprendiendo donde lo dejaste hoy
      </p>
    </header>
  );
}
