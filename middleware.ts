import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnSignIn = req.nextUrl.pathname === "/signin";

  if (!isLoggedIn && !isOnSignIn) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    return Response.redirect(signInUrl);
  }

  if (isLoggedIn && isOnSignIn) {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return Response.redirect(homeUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};