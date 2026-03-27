import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  const isPublicRoute = pathname === "/" || pathname === "/privacy" || pathname === "/terms";
  const isSignInRoute = pathname === "/signin";
  const isAppRoute = pathname.startsWith("/app");

  // If logged in and trying to access signin page → redirect to app
  if (isLoggedIn && isSignInRoute) {
    return Response.redirect(new URL("/app", req.nextUrl.origin));
  }

  // If logged in and on landing page → redirect to app
  if (isLoggedIn && pathname === "/") {
    return Response.redirect(new URL("/app", req.nextUrl.origin));
  }

  // If NOT logged in and trying to access app → redirect to signin
  if (!isLoggedIn && isAppRoute) {
    return Response.redirect(new URL("/signin", req.nextUrl.origin));
  }

  // Everything else passes through
  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};