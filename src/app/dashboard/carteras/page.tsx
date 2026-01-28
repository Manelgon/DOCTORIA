import { DashboardLayout } from "@/components/dashboard/layout"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientTable } from "@/components/dashboard/carteras/client-table"
import { CreatePortfolioModal } from "@/components/dashboard/carteras/create-portfolio-modal"
import { Briefcase, Activity, ShieldCheck, Mail, Users } from "lucide-react"

export default async function CarterasPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login/profesionales")
    }

    // Fetch all accessible carteras (owned OR shared via carteras_acceso)
    const { data: carteras, error } = await supabase
        .from("carteras")
        .select(`
            *,
            pacientes:pacientes(count),
            compartidos:carteras_acceso(
                medico:profiles(email)
            )
        `)
        .order("created_at", { ascending: false })

    const portfolioCount = carteras?.length || 0

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Admin Header Pattern */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-1">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Carteras de Clientes
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Gestione carteras y accesos
                        </p>
                    </div>
                </div>

                <ClientTable
                    carteras={carteras || []}
                    userId={user.id}
                    toolbarAction={<CreatePortfolioModal />}
                />
            </div>
        </DashboardLayout>
    )
}
