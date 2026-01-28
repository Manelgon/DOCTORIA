"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, FolderOpen } from "lucide-react"
import { DocumentsTable } from "@/components/dashboard/documents/documents-table"

interface DocumentsHistoryModalProps {
    documents: any[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function DocumentsHistoryModal({ documents, open, onOpenChange, trigger }: DocumentsHistoryModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger === undefined && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50">
                        <FolderOpen className="h-4 w-4" />
                        Ver Documentos y Pruebas
                    </Button>
                </DialogTrigger>
            )}
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-slate-50 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 border-b border-slate-100 bg-white shadow-sm z-10">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FolderOpen className="h-6 w-6 text-blue-600" />
                        Historial de Documentos
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <DocumentsTable documents={documents} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
