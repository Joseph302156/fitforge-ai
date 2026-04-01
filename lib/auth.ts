import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export type AuthUser = {
  id: string
  email: string
  name: string
  image?: string
}

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-this"
)

const COOKIE_NAME = "fitforge_session"

export async function createSession(user: AuthUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET)
  return token
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return (payload as any).user as AuthUser
  } catch {
    return null
  }
}

export function setSessionCookie(token: string): string {
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Expires=${expires.toUTCString()}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
}