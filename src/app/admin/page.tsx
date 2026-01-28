import { DashboardLayout } from "@/components/dashboard/layout"
import { ShieldCheck, Settings } from "lucide-react"

export default function AdminDashboard() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Unified Header Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Panel de Administración Global
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium max-w-2xl">
                            Supervisión centralizada del ecosistema Doctoria. Gestión de licencias, auditoría y control de seguridad.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
                        <h3 className="font-semibold text-slate-900">Gestión de Médicos</h3>
                        <p className="text-sm text-slate-500 mt-1">Control de altas, bajas y licencias.</p>
                        <div className="mt-4 text-2xl font-bold text-blue-600">--</div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
                        <h3 className="font-semibold text-slate-900">Total Pacientes</h3>
                        <p className="text-sm text-slate-500 mt-1">Visibilidad global de la base de datos.</p>
                        <div className="mt-4 text-2xl font-bold text-blue-600">--</div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
                        <h3 className="font-semibold text-slate-900">Auditoría de Sistema</h3>
                        <p className="text-sm text-slate-500 mt-1">Logs de acceso y acciones críticas.</p>
                        <div className="mt-4 text-2xl font-bold text-blue-600">Seguro</div>
                    </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50/50 p-8 flex items-center justify-center text-slate-400 min-h-[400px]">
                    Zona de Administración Integral en desarrollo...
                </div>
            </div>
        </DashboardLayout>
    )
}
