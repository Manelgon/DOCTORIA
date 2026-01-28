"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return data || []
}

export async function markAsRead(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from("notificaciones")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", user.id)

    revalidatePath("/dashboard")
}
