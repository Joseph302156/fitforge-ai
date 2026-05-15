import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/`,
      "Set-Cookie": `fitforge_session=; Path=/; HttpOnly; SameSite=Lax; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    },
  })
}
