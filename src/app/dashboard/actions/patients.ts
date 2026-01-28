"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getMasterAlergias() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("master_alergias")
        .select("nombre")
        .order("nombre", { ascending: true })

    if (error) {
        console.error("Error fetching master_alergias:", error)
        return []
    }

    return data.map(a => a.nombre)
}

export async function createPaciente(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) throw new Error("No autenticado")

    const nombre = formData.get("nombre") as string
    const apellido1 = formData.get("apellido1") as string
    const apellido2 = formData.get("apellido2") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const birth_date = formData.get("birth_date") as string || null

    // 1. Create user via Supabase Auth Admin (with password)
    let inviteData: any = null
    let inviteError: any = null

    const { data: maybeUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // AUTO-ACTIVATE: Skip email confirmation link
        user_metadata: {
            role: 'paciente',
            nombre: nombre,
            apellidos: `${apellido1} ${apellido2}`.trim()
        }
    })

    inviteData = maybeUser
    inviteError = createError

    // If fails because user already exists, try to get their ID anyway (for recovery)
    if (inviteError && (inviteError.status === 422 || inviteError.message?.includes('already registered'))) {
        const { data: existingUser } = await adminSupabase.auth.admin.listUsers()
        const user = existingUser?.users.find(u => u.email === email)
        if (user) {
            inviteData = { user }
            inviteError = null

            // If user existed but wasn't confirmed, confirm them now
            if (!user.email_confirmed_at) {
                await adminSupabase.auth.admin.updateUserById(user.id, { email_confirm: true })
            }
        }
    }

    if (inviteError) {
        console.error("Error creating/inviting patient:", inviteError)
        return { error: `Error Auth: ${inviteError.message} (${inviteError.status})` }
    }

    // CIP Generation Logic
    // Format: [2 initials Surname1][2 initials Surname2][6-digit sequence][DDMMYYYY]

    // 1. Get next sequence value
    const { data: seqData, error: seqError } = await supabase.rpc('get_next_patient_seq')
    const sequence = seqData ? seqData.toString().padStart(6, '0') : '000000'

    // 2. Get initials (2 from first surname, 2 from second surname)
    const initials1 = (apellido1 || 'XX').substring(0, 2).toUpperCase()
    const initials2 = (apellido2 || 'XX').substring(0, 2).toUpperCase()

    // 3. Format birthdate (DDMMYYYY)
    const formattedDate = birth_date
        ? birth_date.split('-').reverse().join('')
        : '00000000'

    const cip = `${initials1}${initials2}${sequence}${formattedDate}`

    const medicalHistoryRaw = formData.get("medical_history") as string || '[]'
    const medicalHistory = JSON.parse(medicalHistoryRaw)

    const data = {
        id: inviteData.user.id, // Use the Auth ID as Patient ID
        cartera_id: formData.get("cartera_id") as string,
        medico_creador_id: currentUser.id,
        nombre,
        apellido1,
        apellido2,
        full_name: `${nombre} ${apellido1} ${apellido2}`.trim(),
        email,
        cip,
        dni: formData.get("dni") as string,
        birth_date,
        phone: formData.get("phone") as string || null,
        phone_prefix: formData.get("phone_prefix") as string || '+34',
        phone_2: formData.get("phone_2") as string || null,
        phone_prefix_2: formData.get("phone_prefix_2") as string || '+34',

        // Structured Address
        street_type: formData.get("street_type") as string || '',
        street: formData.get("street") as string || '',
        street_number: formData.get("street_number") as string || '',
        block: formData.get("block") as string || '',
        floor: formData.get("floor") as string || '',
        door: formData.get("door") as string || '',
        city: formData.get("city") as string || '',
        province: formData.get("province") as string || '',
        zip_code: formData.get("zip_code") as string || '',

        // Computed full address for legacy/display support
        address: `${formData.get("street_type")} ${formData.get("street")}, ${formData.get("street_number")}. ${formData.get("city")} (${formData.get("province")})`.trim(),
        blood_group: formData.get("blood_group") as string || null,
        sexo: formData.get("sexo") as string || null,
        medical_history: medicalHistory,
        is_active: true // AUTO-ACTIVATE: Set to true directly
    }

    const { data: newPaciente, error } = await supabase.from("pacientes").insert(data).select().single()

    if (error) {
        console.error("Error al crear paciente en DB:", error)
        return { error: `Error DB: ${error.message} (${error.code})` }
    }

    // sync allergies to dedicated table
    const allergiesOnly = medicalHistory.filter((h: any) => h.type === 'alergia')
    if (allergiesOnly.length > 0) {
        const allergyData = allergiesOnly.map((a: any) => ({
            paciente_id: newPaciente.id,
            nombre: a.value,
            estado: a.status || 'Activa',
            comentario: a.comment || null
        }))
        await supabase.from("paciente_alergias").insert(allergyData)
    }

    revalidatePath("/dashboard/pacientes")
    revalidatePath(`/dashboard/carteras/${data.cartera_id}`)

    return { success: true, paciente: newPaciente }
}

export async function resendPatientInvitation(patientId: string, email: string) {
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email)

    if (error) {
        console.error("Error resending invitation:", error)
        return { error: "No se pudo reenviar la invitación" }
    }

    return { success: true }
}

export async function resetPatientPassword(email: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
        console.error("Error resetting password:", error)
        return { error: "No se pudo enviar el correo de recuperación" }
    }

    return { success: true }
}

export async function updatePaciente(formData: FormData) {
    const supabase = await createClient()

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) throw new Error("No autenticado")

    const id = formData.get("id") as string
    const nombre = formData.get("nombre") as string
    const apellido1 = formData.get("apellido1") as string
    const apellido2 = formData.get("apellido2") as string
    const birth_date = formData.get("birth_date") as string || null

    const medicalHistoryRaw = formData.get("medical_history") as string || '[]'
    const medicalHistory = JSON.parse(medicalHistoryRaw)

    const data = {
        cartera_id: formData.get("cartera_id") as string,
        nombre,
        apellido1,
        apellido2,
        full_name: `${nombre} ${apellido1} ${apellido2}`.trim(),
        dni: formData.get("dni") as string,
        birth_date,
        phone: formData.get("phone") as string || null,
        phone_prefix: formData.get("phone_prefix") as string || '+34',
        phone_2: formData.get("phone_2") as string || null,
        phone_prefix_2: formData.get("phone_prefix_2") as string || '+34',

        // Structured Address
        street_type: formData.get("street_type") as string || '',
        street: formData.get("street") as string || '',
        street_number: formData.get("street_number") as string || '',
        block: formData.get("block") as string || '',
        floor: formData.get("floor") as string || '',
        door: formData.get("door") as string || '',
        city: formData.get("city") as string || '',
        province: formData.get("province") as string || '',
        zip_code: formData.get("zip_code") as string || '',

        // Computed full address for legacy/display support
        address: `${formData.get("street_type")} ${formData.get("street")}, ${formData.get("street_number")}. ${formData.get("city")} (${formData.get("province")})`.trim(),
        blood_group: formData.get("blood_group") as string || null,
        sexo: formData.get("sexo") as string || null,
        medical_history: medicalHistory,
    }

    const { error } = await supabase.from("pacientes").update(data).eq("id", id)

    if (error) {
        console.error("Error al actualizar paciente en DB:", error)
        return { error: `Error DB: ${error.message}` }
    }

    // Sync allergies to dedicated table
    // Simplest way: Delete all and re-insert (fine for small lists)
    await supabase.from("paciente_alergias").delete().eq("paciente_id", id)

    const allergiesOnly = medicalHistory.filter((h: any) => h.type === 'alergia')
    if (allergiesOnly.length > 0) {
        const allergyData = allergiesOnly.map((a: any) => ({
            paciente_id: id,
            nombre: a.value,
            estado: a.status || 'Activa',
            comentario: a.comment || null
        }))
        await supabase.from("paciente_alergias").insert(allergyData)
    }

    revalidatePath("/dashboard/pacientes")
    revalidatePath(`/dashboard/pacientes/${id}`)
    revalidatePath(`/dashboard/carteras/${data.cartera_id}`)

    return { success: true }
}
