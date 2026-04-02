import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/app"
  const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`
  const redirectUri = `${baseUrl}/api/auth/callback/google`

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: encodeURIComponent(callbackUrl),
    access_type: "offline",
    prompt: "select_account",
  })

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
