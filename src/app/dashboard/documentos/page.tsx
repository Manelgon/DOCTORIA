"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { FileText, Search, Filter } from "lucide-react"
import { DocumentsTable } from "@/components/dashboard/documents/documents-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DocumentsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Unified Header Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
                            Documentos y Firmas
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium max-w-2xl">
                            Gestión centralizada de consentimientos, informes y documentación clínica legalmente vinculante.
                        </p>
                    </div>
                </div>

                {/* Unified Toolbar */}
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar en todos los documentos..."
                            className="pl-9 bg-slate-50 border-slate-200 h-10 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" className="h-10 border-slate-200 text-slate-600 gap-2 w-full md:w-auto">
                            <Filter className="h-4 w-4" />
                            Filtrar
                        </Button>
                    </div>
                </div>

                {/* Documents Table */}
                <div className="animate-in fade-in duration-500">
                    <DocumentsTable documents={[]} />
                </div>
            </div>
        </DashboardLayout>
    )
}
