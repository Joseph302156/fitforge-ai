"use client"
import { useState, useEffect, createContext, useContext } from "react"

type AuthUser = {
  id: string
  email: string
  name: string
  image?: string
}

type SessionContextType = {
  data: { user: AuthUser } | null
  status: "loading" | "authenticated" | "unauthenticated"
}

const SessionContext = createContext<SessionContextType>({
  data: null,
  status: "loading",
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionContextType>({
    data: null,
    status: "loading",
  })

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setSession({ data: { user: data.user }, status: "authenticated" })
        } else {
          setSession({ data: null, status: "unauthenticated" })
        }
      })
      .catch(() => {
        setSession({ data: null, status: "unauthenticated" })
      })
  }, [])

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}

export function signIn(provider: string, options?: { callbackUrl?: string }) {
  const callbackUrl = options?.callbackUrl || "/app"
  window.location.href = `/api/auth/initiate?callbackUrl=${encodeURIComponent(callbackUrl)}`
}

export function signOut(options?: { callbackUrl?: string }) {
  window.location.href = `/api/auth/signout`
}