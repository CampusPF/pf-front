"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* Pantalla de confirmación tras un pago exitoso. Ocupa toda la ventana
   (fixed inset-0) a propósito: tapa el Navbar/Footer del layout (marketing)
   para replicar el diseño de confirmación "a foco completo".

   Los datos del plan / próxima facturación / ID de transacción son fijos
   por ahora — placeholders del diseño. Cuando el backend exponga el
   endpoint que consulta el estado real del pago (ver el TODO en
   app/(marketing)/checkout/success/page.tsx) hay que leer
   ?payment_intent=... de la query y traer estos valores de ahí. */
export function CheckoutSuccess() {
  // El ícono arranca oculto (scale 0) y anima al montar. La ruta ya
  // depende de JS (RequireAuth es client-side), así que no hay fallback
  // sin JS que cuidar. El rAF asegura que el navegador haya "pintado" el
  // estado inicial antes de arrancar la animación.
  const [animateIcon, setAnimateIcon] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimateIcon(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0B0B14] px-4 py-10">
      {/* Glow verde/teal sutil en el borde derecho */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(45% 55% at 100% 42%, rgba(16, 185, 129, 0.16), transparent 72%), radial-gradient(35% 40% at 92% 88%, rgba(20, 184, 166, 0.1), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[480px] rounded-2xl bg-[#1A1A2E] p-8 shadow-2xl shadow-black/50">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-[#22C55E]/15 text-[#22C55E]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="m9 8-4 4 4 4M15 8l4 4-4 4M13.5 6l-3 12" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold text-white">Campus.</span>
        </div>

        {/* Ícono de éxito animado (keyframes en app/globals.css) */}
        <div
          className={`checkout-fx relative mx-auto mt-8 flex size-16 items-center justify-center ${
            animateIcon ? "checkout-fx--in" : ""
          }`}
        >
          <span
            aria-hidden
            className="checkout-ring absolute inset-0 rounded-full bg-[#22C55E]"
          />
          <span className="checkout-icon relative flex size-16 items-center justify-center rounded-full bg-[#22C55E]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="checkout-check size-8 text-white"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-white">
          ¡Listo, ya sos parte de Campus Premium!
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[#A1A1AA]">
          Te enviamos un email de confirmación. Tu suscripción está activa desde
          ahora.
        </p>

        <hr className="my-6 border-white/10" />

        {/* Resumen */}
        <div className="rounded-xl bg-white/3 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-white">
              Plan Premium · US$ 19,00 / mes
            </span>
            <span className="shrink-0 rounded-full bg-[#6366F1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Activo
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#8A8A99]">
            Próxima facturación: 9 de octubre de 2026
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A8A99]">
              ID Transacción
            </span>
            <span className="font-mono text-xs text-[#A1A1AA]">
              CMP-8942-TX-PRM
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#6366F1] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors duration-150 hover:bg-[#5558E3]"
          >
            Ir a mi dashboard
          </Link>
          <Link
            href="/courses"
            className="rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-medium text-[#D4D4D8] transition-colors duration-150 hover:bg-white/6"
          >
            Explorar cursos
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-[#6B6B7B]">
          ¿Dudas? Escribinos a{" "}
          <a
            href="mailto:soporte@campus.com"
            className="text-[#8A8A99] transition-colors duration-150 hover:text-[#A1A1AA]"
          >
            soporte@campus.com
          </a>
        </p>
      </div>
    </div>
  );
}
