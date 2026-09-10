# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

`pf-frontend` ("Campus") — a Spanish-language online course platform with an AI tutor, built on **Next.js 16 (App Router) + React 19 + Tailwind CSS v4**. This is the frontend only; it talks to a separate NestJS backend (`pf-back`). Comments and UI copy are in Spanish (rioplatense); keep that convention.

## Commands

```bash
npm run dev      # dev server on http://localhost:3000 (also rewrites AGENTS.md — commit that change with your work)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test suite and no test runner configured. Type-check with `npx tsc --noEmit`.

## Environment

`.env.local` (gitignored) holds:
- `NEXT_PUBLIC_API_URL` — backend base URL (defaults to `http://localhost:3001` if unset)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe **publishable** key (`pk_test_...`); the secret key lives only in the backend

Path alias: `@/*` maps to the repo root.

## Architecture

### Route groups define the "chrome"

The root `app/layout.tsx` is intentionally minimal (html/body + global providers). Each route group supplies its own layout:
- **`app/(marketing)/`** — public: landing, course catalog, course detail, login/register, checkout. Shares `Navbar` + `Footer`.
- **`app/(app)/`** — authenticated area (`/dashboard`): sidebar + topbar shell, wrapped in `RequireAuth`.
- **`app/(marketing)/courses/[slug]/learn/`** — the lesson player, also `RequireAuth`-gated. Note the TODO in its layout: it can't hide the marketing Navbar/Footer, so it fakes immersion with a `fixed` header.

Route groups add no URL segment. The catalog and course detail are deliberately public; only the player and dashboard require auth.

### Backend contract adapter layer (`services/`)

The backend does not yet match its own contract, and **`services/` is where every discrepancy is absorbed so components stay clean**. Search for `TODO(back)` — each marks a place to simplify once the backend catches up.

- **`services/api-client.ts`** — the single HTTP client (`apiFetch<T>`). Handles base URL, `Authorization: Bearer`, `credentials: "include"`, tolerant envelope unwrapping (`{ data, message? }` vs raw), tolerant error-message extraction (Nest `{ error, message[] }`), and `ApiError` (with `status`; `status === 0` = network/CORS failure).
- **`services/auth/`** — `auth.service.ts` normalizes `access_token`→`accessToken`; `token-storage.ts` keeps the session in `localStorage` (keys `campus.token` / `campus.user`), every access SSR-guarded and try/catch-wrapped. The backend also sets an HttpOnly cookie, but JS never touches it and it's cross-domain in prod, so `localStorage` is the source of truth for route protection. `getGoogleAuthUrl(flow)` appends `?flow=login|register` (carried through OAuth as `state`): from `/login` Google never creates accounts, from `/register` it creates one if the email is new and rejects if it already exists. Failures come back as `/{login|register}?error=not_registered|already_registered`, mapped to a message by `services/auth/oauth-error.ts` and shown by `LoginCard` / `RegisterCard`.
- **`services/dashboard/`** — aggregates `GET /course-enrollments/me`, `/lesson-progress/me`, `/subscriptions/me` (all Bearer-auth). `enrollment.progressPercent` is **derived server-side**: the backend recalculates it (and `completedAt`) on every `POST`/`PATCH`/`DELETE` to `/lesson-progress`. No client writes it — `PATCH /course-enrollments/:id` was removed for exactly that reason. To move a course's progress, complete lessons. `dashboard.service.ts` is the raw GETs; `dashboard.view.ts` maps them to what the dashboard components render and is the single place documenting what is **real** vs still **mock** (streak/achievements/hours have no endpoint; per-course lesson totals and the "continue learning" module/next-lesson aren't in `/me`; recommended courses need a catalog adapter that doesn't exist yet). `components/dashboard/DashboardDataProvider.tsx` fetches once under `RequireAuth` and shares it via `useDashboardData()`.
- **`services/courses/courses.service.ts`** — `CLIENT_SIDE_FILTERING = true` because `GET /courses` ignores query params: it fetches the full list and filters/paginates in `courses.client-filter.ts`. `getCourseBySlug` resolves slug→id via the list (extra request) because detail resolves by id, not slug.
- **`services/profile/`** — perfil propio (`GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password`), que alimenta `/dashboard/configuracion`. `GET /users/me` devuelve los datos personales más `hasPassword` e `isGoogleAccount`: una cuenta creada con Google no tiene `passwordHash`, y la sección de contraseña se adapta para dejarla crear una sin pedir la actual. El email no es editable — mandarlo (o mandar `role`) devuelve 400 por `forbidNonWhitelisted`. Las reglas de validación viven en `services/auth/validation-rules.ts`, compartidas con el registro.
- **`services/subscriptions/`** — `GET /subscriptions/me` (devuelve el historial completo; la vigente se busca con `findActiveSubscription`) y `PATCH /subscriptions/:id/cancel`. El alta no pasa por acá: la activa el webhook de Stripe.
- **`services/checkout.service.ts`** — Stripe PaymentIntent flow. Payment confirms in-browser; access is activated server-side by two independent paths: `/checkout/success` first calls `syncPayment(payment_intent)` → `POST /payments/:intentId/sync`, where the backend asks Stripe directly and activates if the charge succeeded (works with no webhook, e.g. on localhost), then polls `waitForAccessConfirmation`; the Stripe webhook remains as the backstop for users who close the tab before returning. `hasAccess` pre-check avoids showing the card form for something already owned (backend 409 is the real guard).

### Client-side state

- **Auth** — `components/auth/AuthProvider.tsx` (React Context). `isLoading` starts `true`, resolves only on the client to avoid hydration mismatch. Revalidates against the backend on `pageshow` with `persisted: true` (bfcache) via `GET /users/me`. `RequireAuth` / `RedirectIfAuthenticated` do client-side route protection (replacing an old `proxy.ts` cookie check that fails cross-domain).
- **Theme** — `lib/use-theme.ts`, an external store via `useSyncExternalStore` (not React state), backed by `<html data-theme>` + `localStorage` + `prefers-color-scheme`. A blocking inline script in the root layout applies it before first paint.
- **AI tutor** — `components/ai-tutor/AiTutorProvider.tsx` (Context; a Zustand store was speced but zustand isn't installed). FAB + drawer live in the root layout so the tutor opens from any screen; `LessonTutorContext` feeds the current lesson title in for a personalized greeting.

### Shared UI

`components/ui/ConfirmDialog.tsx` is the project's only real modal (`role="dialog"` + `aria-modal`, focus trap, ESC, scroll lock, focus restored to the opener). The existing side drawers (`AiTutorDrawer`, `DashboardSidebar`) predate it and have none of that — don't copy them for anything that interrupts the user to ask for a decision. `components/ui/input-styles.ts` holds the shared `inputClass(hasError)` used by every form.

### Mock data

`data/*.mock.ts` provides course/dashboard/lesson/progress fixtures used where the backend has no endpoint yet. `data/countries.ts` is generated by `scripts/gen-countries.mjs`.
