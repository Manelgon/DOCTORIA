import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Users, Briefcase, Calendar, ClipboardCheck, LayoutDashboard, ShieldCheck } from "lucide-react"

export default async function DashboardPage() {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Use Admin Client to bypass RLS for role check
    const { data: profile } = await adminSupabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    // Fetch stats based on role
    let stats = []

    if (isAdmin) {
        const { count: doctorsCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "medico")

        const { count: carterasCount } = await supabase
            .from("carteras")
            .select("*", { count: "exact", head: true })

        stats = [
            { name: "Médicos Totales", value: doctorsCount || 0, icon: Users, color: "text-blue-600" },
            { name: "Carteras Activas", value: carterasCount || 0, icon: Briefcase, color: "text-emerald-600" },
        ]
    } else {
        // Stats for Doctor
        const { count: myCarteras } = await supabase
            .from("carteras")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user?.id)

        const { count: myPatients } = await supabase
            .from("pacientes")
            .select("*", { count: "exact", head: true })

        stats = [
            { name: "Mis Carteras", value: myCarteras || 0, icon: Briefcase, color: "text-blue-600" },
            { name: "Pacientes Propios", value: myPatients || 0, icon: Users, color: "text-indigo-600" },
            { name: "Citas Hoy", value: "0", icon: Calendar, color: "text-orange-600" },
            { name: "Tareas", value: "0", icon: ClipboardCheck, color: "text-rose-600" },
        ]
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Unified Header Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {isAdmin ? "Panel de Administración" : "Resumen Profesional"}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium max-w-2xl">
                            {isAdmin
                                ? `Bienvenido, ${profile?.full_name || 'Admin'}. Supervisión global del ecosistema y control de accesos.`
                                : `Hola, Dr. ${profile?.full_name || 'Médico'}. Este es su centro de mando clínico para hoy.`
                            }
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-xl bg-slate-50 ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En tiempo real</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {!isAdmin ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Agenda Próxima</h2>
                                <button className="text-blue-600 text-xs font-bold hover:underline">Ver agenda completa</button>
                            </div>
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Calendar className="h-8 w-8 text-slate-200" />
                                </div>
                                <p className="text-slate-500 max-w-xs">No tienes citas programadas para las próximas horas.</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
                            <h3 className="text-xl font-bold mb-2">Acceso a REMPe</h3>
                            <p className="text-blue-100 text-sm mb-6">Emite recetas electrónicas oficiales de forma segura e integrada.</p>
                            <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-lg shadow-blue-800/20 hover:bg-blue-50 transition-colors">
                                Nueva Receta
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
                        <h2 className="font-bold text-blue-900 mb-2">Modo Administrador Activo</h2>
                        <p className="text-blue-700 text-sm">
                            Tienes acceso total a la gestión de profesionales. Desde el menú de la izquierda puedes dar de alta médicos,
                            supervisar sus carteras y gestionar los permisos de la plataforma.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
