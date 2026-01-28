"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createCartera(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const nombre = formData.get("nombre") as string
    const descripcion = formData.get("descripcion") as string || null
    const shareEmail = formData.get("shareEmail") as string

    const { data: newCartera, error } = await supabase
        .from("carteras")
        .insert({
            nombre,
            descripcion,
            owner_id: user.id,
        })
        .select()
        .single()

    if (error) {
        console.error("Error al crear cartera:", error)
        return { error: "Error al crear la cartera" }
    }

    let shareResult = null
    if (shareEmail && shareEmail.trim() !== "") {
        shareResult = await sharePortfolio(newCartera.id, shareEmail)
    }

    revalidatePath("/dashboard/carteras")

    return {
        success: true,
        cartera: newCartera,
        shareResult: shareResult
    }
}

export async function sharePortfolio(carteraId: string, email: string) {
    const supabase = await createClient()

    const { data: { user: sender } } = await supabase.auth.getUser()
    if (!sender) throw new Error("No autenticado")

    // 1. Find if the email belongs to a doctor
    const { data: recipient, error: profileError } = await supabase
        .from("profiles")
        .select("id, nombre, apellidos")
        .eq("email", email)
        .eq("role", "medico")
        .single()

    if (profileError || !recipient) {
        return { error: "El correo no corresponde a ningún profesional registrado." }
    }

    if (recipient.id === sender.id) {
        return { error: "No puedes compartir una cartera contigo mismo." }
    }

    // 2. Check if already shared or pending
    const { data: existingInvite } = await supabase
        .from("carteras_invitaciones")
        .select("id, status")
        .eq("cartera_id", carteraId)
        .eq("recipient_id", recipient.id)
        .neq("status", "rejected")
        .single()

    if (existingInvite) {
        if (existingInvite.status === 'accepted') return { error: "Esta cartera ya está compartida con este profesional." }
        return { error: "Ya existe una invitación pendiente para este profesional." }
    }

    // 3. Create invitation
    const { data: invite, error: inviteError } = await supabase
        .from("carteras_invitaciones")
        .insert({
            cartera_id: carteraId,
            sender_id: sender.id,
            recipient_id: recipient.id,
            status: 'pending'
        })
        .select()
        .single()

    if (inviteError) return { error: "Error al crear la invitación." }

    // 4. Create notification for recipient
    const { error: notifError } = await supabase
        .from("notificaciones")
        .insert({
            user_id: recipient.id,
            type: 'portfolio_invitation',
            content: {
                cartera_id: carteraId,
                invite_id: invite.id,
                sender_name: sender.user_metadata?.nombre || sender.email
            }
        })

    if (notifError) console.error("Error creating notification:", notifError)

    return { success: true }
}

export async function acceptInvitation(inviteId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // 1. Get invite
    const { data: invite, error: fetchError } = await supabase
        .from("carteras_invitaciones")
        .select("*")
        .eq("id", inviteId)
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .single()

    if (fetchError || !invite) return { error: "Invitación no encontrada." }

    // 2. Add access
    const { error: accessError } = await supabase
        .from("carteras_acceso")
        .insert({
            cartera_id: invite.cartera_id,
            medico_id: user.id,
            permiso: 'leer' // Default
        })

    if (accessError) return { error: "Error al conceder acceso." }

    // 3. Update invite status
    await supabase
        .from("carteras_invitaciones")
        .update({ status: 'accepted' })
        .eq("id", invite.id)

    // 4. Create notification for sender?
    // Optional, let's keep it simple for now.

    revalidatePath("/dashboard/carteras")
    return { success: true }
}

export async function updateCartera(id: string, nombre: string, descripcion: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const { error } = await supabase
        .from("carteras")
        .update({ nombre, descripcion })
        .eq("id", id)
        .eq("owner_id", user.id)

    if (error) return { error: "Error al actualizar la cartera." }

    revalidatePath("/dashboard/carteras")
    return { success: true }
}

export async function deleteCartera(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // 1. Check if empty
    const { count, error: countError } = await supabase
        .from("pacientes")
        .select("*", { count: 'exact', head: true })
        .eq("cartera_id", id)

    if (countError) return { error: "Error al verificar la cartera." }
    if (count && count > 0) {
        return { error: "la cartera para ser eliminada debe de estar vacía" }
    }

    // 2. Delete
    const { error: deleteError } = await supabase
        .from("carteras")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id)

    if (deleteError) return { error: "Error al eliminar la cartera." }

    revalidatePath("/dashboard/carteras")
    return { success: true }
}
