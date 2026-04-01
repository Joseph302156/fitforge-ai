import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  redirectProxyUrl: `${process.env.NEXTAUTH_URL}/api/auth`,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    }
  }
})
```

The key addition is `redirectProxyUrl` — this tells Auth.js to use your known `NEXTAUTH_URL` as the proxy for the OAuth redirect instead of trying to infer it from the request, which is what causes the PKCE cookie to get lost between the serverless function that sets it and the one that reads it.

Make sure `NEXTAUTH_URL` in Vercel is set to your exact URL:
```
https://fitforge-gw1ltrpsk-joseph302156s-projects.vercel.app