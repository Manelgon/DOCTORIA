"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const expectedRole = formData.get("role") as string // "medico" or "paciente"

    const redirectPath = expectedRole === 'medico' ? '/login/profesionales' : '/login/pacientes'

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !user) {
        return redirect(`${redirectPath}?error=Credenciales inválidas`)
    }

    // Verify Role in DB using ADMIN client to bypass RLS
    console.log("Verifying role with Admin Client for UID:", user.id)
    const { data: profile, error: profileError } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    console.log("Admin Profile Result:", { profile, profileError })

    const userRole = (profile?.role || '').toLowerCase().trim()
    const isAllowed = userRole === expectedRole || userRole === 'admin'

    if (profileError || !profile || !isAllowed) {
        console.error("Login Denied Debug:", {
            id: user.id,
            found: userRole,
            expected: expectedRole,
            profileError
        })

        await supabase.auth.signOut()

        let errorMsg = expectedRole === 'medico'
            ? `Acceso denegado. Rol detectado: '${userRole}'. Se esperaba 'medico' o 'admin'.`
            : "Esta cuenta no tiene acceso al portal de pacientes."

        if (profileError) {
            errorMsg = `Error de base de datos: ${profileError.message}`
        }

        return redirect(`${redirectPath}?error=${encodeURIComponent(errorMsg)}`)
    }

    return redirect("/dashboard")
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        options: {
            data: {
                role: "paciente",
                full_name: formData.get("full_name") || "Paciente Nuevo",
            }
        }
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return redirect("/login/pacientes?error=Error al crear cuenta")
    }

    return redirect("/dashboard")
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect("/login/profesionales")
}
