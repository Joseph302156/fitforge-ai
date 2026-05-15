import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("fitforge_session")?.value
  const isLoggedIn = !!session

  if (isLoggedIn && (pathname === "/" || pathname === "/signin")) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  if (!isLoggedIn && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
