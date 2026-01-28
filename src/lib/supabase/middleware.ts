import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from './admin'

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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

    const { data: { user } } = await supabase.auth.getUser()

    // Paths that start with /login
    const isLoginPage = request.nextUrl.pathname.startsWith('/login')
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')

    // Protect /dashboard
    if (isDashboardPage && !user) {
        return NextResponse.redirect(new URL('/login/profesionales', request.url))
    }

    // Protect /admin
    if (isAdminPage) {
        if (!user) {
            return NextResponse.redirect(new URL('/login/profesionales', request.url))
        }

        // Use Admin Client to bypass RLS for role check in middleware
        const adminSupabase = createAdminClient()
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // If logged in, don't allow access to login pages
    if (isLoginPage && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Handle generic /login redirect to professionals by default
    if (request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/login/profesionales', request.url))
    }

    return supabaseResponse
}
