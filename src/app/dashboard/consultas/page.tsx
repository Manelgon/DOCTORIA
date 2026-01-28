import { DashboardLayout } from "@/components/dashboard/layout"
import { createClient } from "@/lib/supabase/server"
import { ConsultationsTable } from "@/components/dashboard/consultas/consultations-table"

export default async function ConsultationsPage() {
    const supabase = await createClient()

    const { data: consultations, error } = await supabase
        .from("consultas")
        .select(`
            *,
            paciente:pacientes(id, full_name, cip),
            medico:profiles(nombre, apellidos, especialidad),
            diagnosticos:consultas_diagnosticos(
                rank,
                status,
                catalogo:diagnosticos(display, code, system)
            )
        `)
        .order("fecha", { ascending: false })

    if (error) {
        console.error("Error fetching all consultations:", error)
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                {/* Admin Header Pattern */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-1">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Historial de Consultas
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Cronología de atenciones y seguimientos
                        </p>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ConsultationsTable
                        consultations={consultations || []}
                        showPatientColumn={true}
                        itemsPerPage={15}
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}
