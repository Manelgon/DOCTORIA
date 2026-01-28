import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // SUCCESSFUL VERIFICATION LOGIC
            // The user is now signed in and verified.
            // Requirement: Enable the profile (is_active = true)

            // We use the admin client to bypass RLS in case the user 
            // is still technically "inactive" in RLS policies or just to be safe.
            const adminSupabase = createAdminClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                console.log(`[Auth Callback] User verified: ${user.id}. Activating profile...`)

                // Activate the profile
                await adminSupabase
                    .from('profiles')
                    .update({ is_active: true })
                    .eq('id', user.id)
            }

            const forwardedHost = request.headers.get("x-forwarded-host") // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === "development"
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
}
