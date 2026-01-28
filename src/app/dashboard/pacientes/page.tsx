import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, Activity, ShieldCheck, HeartPulse } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PatientsTable } from "@/components/dashboard/pacientes/patients-table"
import { CreatePatientModal } from "@/components/dashboard/pacientes/create-patient-modal"
import Link from "next/link"

export default async function PatientsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login/profesionales")
    }

    // Fetch all patients from all accessible carteras
    const { data: patients, error } = await supabase
        .from("pacientes")
        .select(`
            *,
            cartera:carteras(nombre)
        `)
        .order("created_at", { ascending: false })

    // Fetch carteras for the modal
    const { data: carteras } = await supabase
        .from("carteras")
        .select("id, nombre")

    const totalPatients = patients?.length || 0

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Admin Header Pattern */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-1">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Listado de Pacientes
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Gestione pacientes y accesos
                        </p>
                    </div>
                </div>

                <PatientsTable
                    patients={patients || []}
                    carteras={carteras || []}
                    toolbarAction={
                        <CreatePatientModal
                            key="create-patient-modal"
                            carteras={carteras || []}
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
        </DashboardLayout>
    )
}
