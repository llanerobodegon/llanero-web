import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  // Role-based access control for authenticated users
  if (user && (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname === "/auth")) {
    const { data: userData } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", user.id)
      .single()

    const roleId = userData?.role_id
    const isAllowed = roleId === 2 || roleId === 3

    // Block unauthorized roles from admin
    if (request.nextUrl.pathname.startsWith("/admin") && !isAllowed) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/auth"
      url.searchParams.set("error", "unauthorized")
      return NextResponse.redirect(url)
    }

    // Only redirect allowed roles from auth to admin
    if (request.nextUrl.pathname === "/auth" && isAllowed) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
