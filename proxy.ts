import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Protección de rutas (Next.js 16: este archivo es "Proxy", el sucesor de
   Middleware). Sólo verifica que exista la cookie del token (la misma que
   setea services/auth/token-storage.ts) — la validez del JWT en sí la sigue
   verificando el back en cada request con Authorization: Bearer. */

const TOKEN_COOKIE = "campus.token";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "redirect",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/courses/:path*"],
};
