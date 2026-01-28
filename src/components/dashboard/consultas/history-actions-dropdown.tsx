"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, FolderOpen, ChevronDown, History } from "lucide-react"
import { ConsultationHistoryModal } from "@/components/dashboard/consultas/consultation-history-modal"
import { DocumentsHistoryModal } from "@/components/dashboard/documents/documents-history-modal"

interface HistoryActionsDropdownProps {
    consultations: any[]
    documents: any[]
}

export function HistoryActionsDropdown({ consultations, documents }: HistoryActionsDropdownProps) {
    const [showConsultations, setShowConsultations] = useState(false)
    const [showDocuments, setShowDocuments] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 h-10 px-4 rounded-xl font-bold shadow-sm">
                        <History className="h-4 w-4" />
                        Historial e Información
                        <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl border-slate-200">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-1.5">
                        Registros Previos
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                        onSelect={() => setShowConsultations(true)}
                        className="rounded-lg p-2.5 focus:bg-blue-50 focus:text-blue-700 cursor-pointer font-bold text-xs gap-3"
                    >
                        <div className="h-7 w-7 rounded-md bg-blue-100/50 flex items-center justify-center text-blue-600">
                            <Clock className="h-3.5 w-3.5" />
                        </div>
                        Historial de Consultas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => setShowDocuments(true)}
                        className="rounded-lg p-2.5 focus:bg-blue-50 focus:text-blue-700 cursor-pointer font-bold text-xs gap-3"
                    >
                        <div className="h-7 w-7 rounded-md bg-blue-100/50 flex items-center justify-center text-blue-600">
                            <FolderOpen className="h-3.5 w-3.5" />
                        </div>
                        Documentos y Pruebas
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConsultationHistoryModal
                consultations={consultations}
                open={showConsultations}
                onOpenChange={setShowConsultations}
                trigger={null}
            />

            <DocumentsHistoryModal
                documents={documents}
                open={showDocuments}
                onOpenChange={setShowDocuments}
                trigger={null}
            />
        </>
    )
}
