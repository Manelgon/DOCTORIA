"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ConsultationSchema = z.object({
    patient_id: z.string().uuid(),
    notes: z.string().optional(),
    aproximacion_diagnostica: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment: z.string().optional(),
    signos_vitales: z.array(z.object({
        type: z.string(),
        value: z.string(),
        unit: z.string().optional()
    })).optional(),
    diagnosticos: z.array(z.object({
        id: z.string().uuid(),
        rank: z.number(),
        status: z.string()
    })).optional()
})

export async function createConsulta(formData: FormData) {
    const supabase = await createClient()

    // Get current user (doctor)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "No autorizado" }
    }

    // Get profile to ensure role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (!profile || (profile.role !== "medico" && profile.role !== "admin")) {
        return { error: "Solo médicos pueden crear consultas" }
    }

    const patient_id = formData.get("patient_id") as string
    const notes = formData.get("notes") as string
    const aproximacion_diagnostica = formData.get("aproximacion_diagnostica") as string
    const diagnosis = formData.get("diagnosis") as string
    const treatment = formData.get("treatment") as string

    // Parse vitals JSON
    let signos_vitales = []
    try {
        signos_vitales = JSON.parse(formData.get("signos_vitales") as string || '[]')
    } catch (e) {
        console.error("Error parsing vitals", e)
    }

    // Parse diagnostics JSON
    let selectedDiagnostics = []
    try {
        selectedDiagnostics = JSON.parse(formData.get("diagnosticos_json") as string || '[]')
    } catch (e) {
        console.error("Error parsing diagnostics", e)
    }

    const consultaData = {
        patient_id,
        medico_id: user.id,
        notes,
        aproximacion_diagnostica,
        diagnosis,
        treatment,
        signos_vitales
    }

    console.log("Creating consultation:", consultaData)

    const { data: newConsulta, error: consultaError } = await supabase
        .from("consultas")
        .insert(consultaData)
        .select()
        .single()

    if (consultaError) {
        console.error("Error creating consultation:", consultaError)
        return { error: `Error DB (Consulta): ${consultaError.message}` }
    }

    // Insert diagnostics relationship if any
    if (selectedDiagnostics.length > 0) {
        const diagnosticsData = selectedDiagnostics.map((d: any) => ({
            consultation_id: newConsulta.id,
            diagnostico_id: d.id,
            rank: d.rank,
            status: d.status,
            created_by: user.id
        }))

        const { error: diagError } = await supabase
            .from("consultas_diagnosticos")
            .insert(diagnosticsData)

        if (diagError) {
            console.error("Error creating consultation diagnostics:", diagError)
            // We don't fail the whole request but log it
        }
    }

    revalidatePath(`/dashboard/pacientes/${patient_id}`)
    revalidatePath("/dashboard/pacientes")

    return { success: true }
}
