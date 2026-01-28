"use server"

import { createClient } from "@/lib/supabase/server"

export async function searchDiagnostics(query: string) {
    const supabase = await createClient()

    if (!query || query.length < 2) return []

    const { data, error } = await supabase
        .from("diagnosticos")
        .select("*")
        .eq("active", true)
        .eq("selectable", true)
        .or(`display.ilike.%${query}%,code.ilike.%${query}%`)
        .limit(20)

    if (error) {
        console.error("Error searching diagnostics:", error)
        return []
    }

    return data
}
