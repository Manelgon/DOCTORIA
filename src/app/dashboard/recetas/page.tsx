import { DashboardLayout } from "@/components/dashboard/layout"
import { ClipboardList } from "lucide-react"

export default function PrescriptionsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Unified Header Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Receta Electrónica
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium max-w-2xl">
                            Emisión y control de prescripciones farmacológicas mediante la plataforma oficial integrada.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-12 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <ClipboardList className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-slate-500 max-w-xs font-medium">Integración con REMPe en desarrollo activo...</p>
                </div>
            </div>
        </DashboardLayout>
    )
}
