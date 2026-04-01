import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (isLoggedIn && pathname === "/signin") {
    return Response.redirect(new URL("/app", req.nextUrl.origin))
  }
  if (isLoggedIn && pathname === "/") {
    return Response.redirect(new URL("/app", req.nextUrl.origin))
  }
  if (!isLoggedIn && pathname.startsWith("/app")) {
    return Response.redirect(new URL("/signin", req.nextUrl.origin))
  }
  return
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}