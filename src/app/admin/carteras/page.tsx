import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardLayout } from "@/components/dashboard/layout"
import { CarterasTable } from "@/components/admin/carteras-table"
import { Briefcase } from "lucide-react"

export default async function AdminCarterasPage() {
    const supabase = createAdminClient()

    // Fetch all portfolios with their owner information
    const { data: carteras } = await supabase
        .from("carteras")
        .select(`
            *,
            owner:profiles!carteras_owner_id_fkey (
                nombre,
                apellidos,
                email
            )
        `)
        .order('created_at', { ascending: false })

    // Map full name for initial display if needed, though CarterasTable handles it
    const formattedCarteras = (carteras || []).map(c => ({
        ...c,
        owner: {
            ...c.owner,
            full_name: `${c.owner.nombre} ${c.owner.apellidos}`.trim()
        }
    }))

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Unified Header Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Control de Carteras
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium max-w-2xl">
                            Auditoría de activos y supervisión global de todas las carteras de pacientes en la plataforma.
                        </p>
                    </div>
                </div>

                <CarterasTable carteras={formattedCarteras} />
            </div>
        </DashboardLayout>
    )
}
