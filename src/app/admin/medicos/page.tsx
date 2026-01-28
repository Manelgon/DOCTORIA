import { DashboardLayout } from "@/components/dashboard/layout"
import { ShieldCheck } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { RegisterDoctorModal } from "@/components/admin/register-doctor-modal"
import { DoctorsTable } from "@/components/admin/doctors-table"

export default async function AdminMedicosPage() {
    const supabase = createAdminClient()

    // Fetch existing doctors
    const { data: doctors } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "medico")
        .order("created_at", { ascending: false })

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Listado de Médicos con Paginación */}
                <DoctorsTable
                    doctors={doctors || []}
                    toolbarAction={<RegisterDoctorModal />}
                />
            </div>
        </DashboardLayout>
    )
}
