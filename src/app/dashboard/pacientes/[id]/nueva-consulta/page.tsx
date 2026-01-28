import { DashboardLayout } from "@/components/dashboard/layout"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, User, Stethoscope, Activity, ClipboardList } from "lucide-react"
import Link from "next/link"
import { CreateConsultationForm } from "@/components/dashboard/consultas/create-consultation-form"
import { HistoryActionsDropdown } from "@/components/dashboard/consultas/history-actions-dropdown"

export default async function NewConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login/profesionales")

    // Fetch patient details
    const { data: patient, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !patient) {
        notFound()
    }

    // Fetch consultations for history modal
    const { data: consultations } = await supabase
        .from("consultas")
        .select(`
            *,
            medico:profiles(nombre, apellidos, especialidad)
        `)
        .eq("patient_id", id)
        .order("fecha", { ascending: false })

    // Fetch documents
    const { data: documents } = await supabase
        .from("patient_documents")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })

    // Fetch doctor profile
    const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("id, nombre, apellidos, full_name, especialidad")
        .eq("id", user.id)
        .single()

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Breadcrumbs */}
                <Link
                    href={`/dashboard/pacientes/${id}`}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-fit group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a la ficha del paciente
                </Link>

                {/* Unified Header Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <ClipboardList className="h-8 w-8 text-blue-600" />
                            Nueva Consulta Médica
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium max-w-2xl">
                            Registrando evolución para <span className="text-slate-900 font-bold">{patient.full_name}</span>
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <HistoryActionsDropdown consultations={consultations || []} documents={documents || []} />
                    </div>
                </div>

                {/* Form Wrapper */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                    <CreateConsultationForm patientId={patient.id} doctorProfile={doctorProfile} />
                </div>
            </div>
        </DashboardLayout>
    )
}
