import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import {
    User,
    ArrowLeft,
    Calendar,
    Smartphone,
    MapPin,
    CreditCard,
    Droplets,
    Activity,
    ClipboardList,
    FileText,
    Clock,
    AlertCircle,
    CheckCircle2,
    Contact,
    Mars,
    Venus,
    HelpCircle
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PatientClinicalView } from "@/components/dashboard/pacientes/patient-clinical-view"
import { cn } from "@/lib/utils"

import { PatientAlerts } from "@/components/dashboard/pacientes/patient-alerts"

interface PatientDetailPageProps {
    params: {
        id: string
    }
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login/profesionales")

    // Fetch doctor profile
    const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("id, nombre, apellidos, full_name, especialidad")
        .eq("id", user.id)
        .single()

    // Fetch patient data
    const { data: patient, error } = await supabase
        .from("pacientes")
        .select(`
            *,
            cartera:carteras(nombre),
            patient_documents(*)
        `)
        .eq("id", id)
        .single()

    if (error || !patient) notFound()

    // Fetch consultations
    const { data: consultations } = await supabase
        .from("consultas")
        .select(`
            *,
            medico:profiles(nombre, apellidos, especialidad),
            diagnosticos:consultas_diagnosticos(
                rank,
                status,
                catalogo:diagnosticos(display, code, system)
            )
        `)
        .eq("patient_id", id)
        .order("fecha", { ascending: false })

    // Fetch structured allergies
    const { data: structuredAlergias } = await supabase
        .from("paciente_alergias")
        .select("*")
        .eq("paciente_id", id)
        .order("created_at", { ascending: true })

    const medicalHistory = patient.medical_history as Array<{ type: 'antecedente' | 'alergia' | 'tratamiento', value: string, status?: any, comment?: any }> || []
    const antecedentes = medicalHistory.filter(h => h.type === 'antecedente')
    const tratamientos = medicalHistory.filter(h => h.type === 'tratamiento')

    // We prefer data from the structured table if available
    const displayAlergias = structuredAlergias && structuredAlergias.length > 0
        ? structuredAlergias.map(a => ({ value: a.nombre, status: a.estado, comment: a.comentario }))
        : medicalHistory.filter(h => h.type === 'alergia')

    // Calculate age
    const age = patient.birth_date
        ? Math.floor((new Date().getTime() - new Date(patient.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Breadcrumbs */}
                <Link
                    href="/dashboard/pacientes"
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors w-fit group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a pacientes
                </Link>

                {/* Admin Header Style */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-baseline gap-2">
                                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{patient.full_name}</h1>
                                    {age !== null && (
                                        <span className="text-lg font-semibold text-gray-300">
                                            {age} <span className="text-[10px] uppercase font-medium text-gray-400">años</span>
                                        </span>
                                    )}
                                    {patient.sexo && (
                                        <div className="flex items-center">
                                            {patient.sexo?.toLowerCase().includes('mujer') || patient.sexo?.toLowerCase().includes('femenino') ? (
                                                <div className="flex items-center justify-center h-6 w-6 rounded bg-pink-50 text-pink-600 border border-pink-200" title="Femenino">
                                                    <Venus className="h-4 w-4" />
                                                </div>
                                            ) : patient.sexo?.toLowerCase().includes('hombre') || patient.sexo?.toLowerCase().includes('masculino') ? (
                                                <div className="flex items-center justify-center h-6 w-6 rounded bg-blue-50 text-blue-600 border border-blue-200" title="Masculino">
                                                    <Mars className="h-4 w-4" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-6 w-6 rounded bg-slate-50 text-slate-500 border border-slate-200" title="No especificado">
                                                    <HelpCircle className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <PatientAlerts
                                    patient={patient}
                                    antecedents={antecedentes}
                                    allergies={displayAlergias}
                                    treatments={tratamientos}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString("es-ES") : 'N/A'}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="flex items-center gap-1.5 text-sm">
                                    <User className="h-4 w-4 text-gray-400" />
                                    {doctorProfile?.nombre && doctorProfile?.apellidos
                                        ? `${doctorProfile.nombre} ${doctorProfile.apellidos}`
                                        : doctorProfile?.full_name || 'Profesional'}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    {patient.cartera?.nombre}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid - Changed to 1 column since we moved alerts to header */}
                <div className="w-full">
                    <PatientClinicalView
                        patient={patient}
                        consultations={consultations || []}
                        doctorProfile={doctorProfile}
                        antecedents={antecedentes}
                        allergies={displayAlergias}
                        treatments={tratamientos}
                        age={age}
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}
