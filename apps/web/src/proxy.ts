import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/join", "/api", "/privacy"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * Lightweight middleware that checks the `logged_in` cookie marker.
 *
 * This cookie is set/cleared by the browser-client when tokens change.
 * It contains NO secrets — just a flag so the middleware can redirect
 * unauthenticated users to /login without a page flash.
 *
 * Real token verification happens on the NestJS API via Bearer header.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = request.cookies.get("logged_in")?.value === "true";

  if (!isLoggedIn) {
    const url = request.nextUrl.clone();
    const redirectTarget = `${pathname}${search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|map|js|css)$).*)",
  ],
};
