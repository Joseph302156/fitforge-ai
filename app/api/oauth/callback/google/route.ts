import { NextRequest } from "next/server"
import { createSession, setSessionCookie } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`

  if (error || !code) {
    return Response.redirect(`${baseUrl}/signin?error=OAuthError`)
  }

  try {
    const redirectUri = `${baseUrl}/api/oauth/callback/google`

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenRes.json()

    if (!tokenRes.ok || !tokens.access_token) {
      console.error("Token exchange failed:", tokens)
      return Response.redirect(`${baseUrl}/signin?error=TokenExchangeFailed`)
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const googleUser = await userRes.json()

    if (!userRes.ok || !googleUser.email) {
      console.error("User info fetch failed:", googleUser)
      return Response.redirect(`${baseUrl}/signin?error=UserInfoFailed`)
    }

    const user = {
      id: googleUser.id || googleUser.sub || googleUser.email,
      email: googleUser.email,
      name: googleUser.name || googleUser.email,
      image: googleUser.picture,
    }

    const token = await createSession(user)
    const cookieHeader = setSessionCookie(token)

    const callbackUrl = state ? decodeURIComponent(state) : "/app"
    const safeCallbackUrl = callbackUrl.startsWith("/") ? callbackUrl : "/app"

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}${safeCallbackUrl}`,
        "Set-Cookie": cookieHeader,
      },
    })
  } catch (err) {
    console.error("Auth callback error:", err)
    return Response.redirect(`${baseUrl}/signin?error=CallbackError`)
  }
}
