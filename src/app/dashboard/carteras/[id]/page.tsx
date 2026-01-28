import { DashboardLayout } from "@/components/dashboard/layout"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { PatientsTable } from "@/components/dashboard/pacientes/patients-table"
import { CreatePatientModal } from "@/components/dashboard/pacientes/create-patient-modal"
import { Briefcase, ArrowLeft, Users, User, Share2, Calendar, FileText, Activity, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CarteraDetailPageProps {
    params: {
        id: string
    }
}

export default async function CarteraDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login/profesionales")

    // Fetch portfolio details with a more flexible query
    const { data: cartera, error: carteraError } = await supabase
        .from("carteras")
        .select(`*`)
        .eq("id", id)
        .single()

    if (carteraError || !cartera) {
        console.error("--- DEBUG PORTFOLIO ERROR ---")
        console.error("User ID:", user.id)
        console.error("Portfolio ID requested:", id)
        console.error("Error Object:", JSON.stringify(carteraError, null, 2))
        console.error("-----------------------------")
        notFound()
    }

    // Secondary fetch for owner profile if needed (separate to avoid join failures)
    const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", cartera.owner_id)
        .single()

    // Fetch patients for this portfolio
    const { data: patients } = await supabase
        .from("pacientes")
        .select(`
            *,
            cartera:carteras(nombre)
        `)
        .eq("cartera_id", id)
        .order("created_at", { ascending: false })

    const patientCount = patients?.length || 0

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Top Nav & Breadcrumbs */}
                {/* Breadcrumbs */}
                <Link
                    href="/dashboard/carteras"
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-fit group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a mis carteras
                </Link>

                {/* Unified Header Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {cartera.nombre}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium max-w-2xl">
                            {cartera.descripcion || 'Esta cartera agrupa pacientes para seguimiento clínico personalizado.'}
                        </p>
                    </div>
                </div>

                {/* Main Content: Standardized Patients Table */}
                <div className="space-y-6">
                    <PatientsTable
                        patients={patients || []}
                        carteras={[{ id: cartera.id, nombre: cartera.nombre }]}
                        showCarteraColumn={false}
                        toolbarAction={
                            <CreatePatientModal
                                carteras={[{ id: cartera.id, nombre: cartera.nombre }]}
                                defaultCarteraId={cartera.id}
                                trigger={
                                    <Button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center gap-2 text-sm">
                                        <UserPlus className="h-5 w-5" />
                                        Nuevo Paciente
                                    </Button>
                                }
                            />
                        }
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}
