import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is an invite/recovery, redirect to set password page
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/set-password`)
      }
      // Otherwise redirect to admin
      return NextResponse.redirect(`${origin}/admin`)
    }
  }

  // Return to login page if there's an error
  return NextResponse.redirect(`${origin}/auth`)
}
