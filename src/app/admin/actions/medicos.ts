"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createDoctor(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 1. Verify that the requester is an ADMIN
    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) throw new Error("No autenticado")

    // Use admin client to verify role to bypass RLS
    const { data: requesterProfile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", requester.id)
        .single()

    if (requesterProfile?.role !== 'admin') {
        throw new Error("Acceso denegado: Solo administradores pueden crear médicos")
    }

    const email = formData.get("email") as string
    const nombre = formData.get("nombre") as string
    const apellidos = formData.get("apellidos") as string
    const password = formData.get("password") as string
    const cif = formData.get("cif") as string
    const telefono = formData.get("telefono") as string
    const direccion = formData.get("direccion") as string
    const especialidad = formData.get("especialidad") as string
    const numero_colegiado = formData.get("numero_colegiado") as string
    const bio = formData.get("bio") as string
    const role = formData.get("role") as 'medico' | 'admin' | 'paciente' || 'medico'
    const avatarFile = formData.get("avatar") as File

    // 2. Create the User in Auth (Using Admin API)
    // We set email_confirm: true so the user is verified immediately.
    const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            nombre,
            apellidos,
            role: role
        }
    })

    if (authError || !newUser.user) {
        return { error: authError?.message || "Error al crear el usuario medico" }
    }

    const userId = newUser.user.id

    // No need to resend verification email as we are auto-confirming.

    let avatarUrl = ""

    try {
        // 3. Handle Avatar Upload
        if (avatarFile && avatarFile.size > 0) {
            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`

            const { error: uploadError } = await adminSupabase.storage
                .from('avatar_profesionales')
                .upload(fileName, avatarFile, {
                    upsert: true,
                    contentType: avatarFile.type
                })

            if (!uploadError) {
                const { data: { publicUrl } } = adminSupabase.storage
                    .from('avatar_profesionales')
                    .getPublicUrl(fileName)
                avatarUrl = publicUrl
            } else {
                console.error("Error al subir avatar:", uploadError.message)
            }
        }

        // 4. Create the Profile
        const { error: profileError } = await adminSupabase.from("profiles").insert({
            id: userId,
            email,
            nombre,
            apellidos,
            cif,
            telefono,
            direccion,
            especialidad,
            numero_colegiado,
            bio,
            avatar_url: avatarUrl,
            role: role,
            full_name: `${nombre} ${apellidos}`,
            is_active: true // Active immediately
        })

        if (profileError) {
            console.error("FATAL: Error creating profile:", profileError)
            // Rollback: Delete the auth user if profile creation fails to avoid orphans
            await adminSupabase.auth.admin.deleteUser(userId)
            return { error: "Error al crear el perfil (Rollback realizado): " + profileError.message }
        }

        // 5. Create an Initial Portfolio
        const { error: carteraError } = await adminSupabase.from("carteras").insert({
            nombre: `Consulta de ${nombre} ${apellidos}`,
            descripcion: "Cartera inicial creada automáticamente",
            owner_id: userId
        })

        if (carteraError) {
            console.error("Error creating initial portfolio, non-critical:", carteraError)
        }

    } catch (e: any) {
        // Emergency Rollback
        await adminSupabase.auth.admin.deleteUser(userId)
        return { error: "Error inesperado (Rollback realizado): " + e.message }
    }

    revalidatePath("/admin/medicos")
    return { success: true }
}

export async function deleteDoctor(doctorId: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) throw new Error("No autenticado")

    const { data: requesterProfile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", requester.id)
        .single()

    if (requesterProfile?.role !== 'admin') {
        throw new Error("Acceso denegado")
    }

    // Delete user from Auth (this cascades to profiles if set up, manually delete profile if not)
    // Using adminSupabase.auth.admin.deleteUser needs SERVICE_ROLE_KEY
    // Assuming profiles has ON DELETE CASCADE on foreign key to auth.users 
    const { error } = await adminSupabase.auth.admin.deleteUser(doctorId)

    if (error) return { error: error.message }

    revalidatePath("/admin/medicos")
    return { success: true }
}

export async function toggleDoctorStatus(doctorId: string, isActive: boolean) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) throw new Error("No autenticado")

    const { data: requesterProfile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", requester.id)
        .single()

    if (requesterProfile?.role !== 'admin') {
        throw new Error("Acceso denegado")
    }

    const { error } = await adminSupabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", doctorId)

    if (error) return { error: error.message }

    revalidatePath("/admin/medicos")
    return { success: true }
}

export async function resetDoctorPassword(email: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) throw new Error("No autenticado")

    const { data: requesterProfile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", requester.id)
        .single()

    if (requesterProfile?.role !== 'admin') {
        throw new Error("Acceso denegado")
    }

    const { error } = await adminSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    })

    if (error) return { error: error.message }

    return { success: true }
}

export async function updateDoctor(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) throw new Error("No autenticado")

    const { data: requesterProfile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", requester.id)
        .single()

    if (requesterProfile?.role !== 'admin') {
        throw new Error("Acceso denegado")
    }

    const id = formData.get("id") as string
    const nombre = formData.get("nombre") as string
    const apellidos = formData.get("apellidos") as string
    const cif = formData.get("cif") as string
    const telefono = formData.get("telefono") as string
    const direccion = formData.get("direccion") as string
    const especialidad = formData.get("especialidad") as string
    const numero_colegiado = formData.get("numero_colegiado") as string
    const bio = formData.get("bio") as string

    // Avatar upload logic could be added here if needed, consistent with create
    // For now, let's update text fields

    const { error } = await adminSupabase
        .from("profiles")
        .update({
            nombre,
            apellidos,
            cif,
            telefono,
            direccion,
            especialidad,
            numero_colegiado,
            bio,
            // email is usually not updated here to avoid auth mismatches without re-auth
        })
        .eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/admin/medicos")
    return { success: true }
}
