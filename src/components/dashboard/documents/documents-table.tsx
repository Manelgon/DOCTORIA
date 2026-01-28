"use client"

import { useState, useRef } from "react"
import { FileText, Download, ExternalLink, Calendar, Search, FileImage, FileBarChart, Pill, Mail, Loader2, Trash2, Plus, Upload, PenTool, Send, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { sendDocumentByEmail } from "@/app/actions/documents"

interface Document {
    id: string
    name: string
    url: string
    type: 'analitica' | 'imagen' | 'informe' | 'receta' | 'otro'
    created_at: string
    is_signed?: boolean
    expires_at?: string
    metadata?: {
        template_id?: string
        custom_notes?: string
    }
}

interface DocumentsTableProps {
    documents: Document[]
    itemsPerPage?: number
    patientEmail?: string
    onCreateDocument?: (data?: { templateId?: string, customNotes?: string, step?: number }) => void
    patientId?: string
    patientCip?: string
}

const TYPE_ICONS = {
    analitica: FileBarChart,
    imagen: FileImage,
    informe: FileText,
    receta: Pill,
    otro: FileText
}

const TYPE_LABELS = {
    analitica: "Analítica",
    imagen: "Imagen",
    informe: "Informe",
    receta: "Receta",
    otro: "Otro"
}

export function DocumentsTable({ documents, itemsPerPage = 10, patientEmail, onCreateDocument, patientId, patientCip }: DocumentsTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [isUploading, setIsUploading] = useState(false)

    // Upload refs
    const fileInputRef = useRef<HTMLInputElement>(null) // General upload
    const signedFileInputRef = useRef<HTMLInputElement>(null) // Replace pending doc
    const [activeDocForUpload, setActiveDocForUpload] = useState<Document | null>(null)

    const router = useRouter()

    // Email State
    const [emailDoc, setEmailDoc] = useState<Document | null>(null)
    const [isSending, setIsSending] = useState(false)

    // Tab State
    const [activeTab, setActiveTab] = useState<'todos' | 'generados' | 'aportados' | 'pendientes'>('todos')

    // Filter
    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.type.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (activeTab === 'generados') {
            return ['informe', 'receta', 'consentimiento'].includes(doc.type)
        }

        if (activeTab === 'aportados') {
            return !['informe', 'receta', 'consentimiento'].includes(doc.type)
        }

        if (activeTab === 'pendientes') {
            // Only generated documents (requires signature) should be in "Pendientes"
            if (!['informe', 'receta', 'consentimiento'].includes(doc.type)) return false

            const isExpired = doc.expires_at ? new Date(doc.expires_at) < new Date() : false
            return !doc.is_signed || isExpired
        }

        return true
    })

    // Pagination
    const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
    const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const TypeIcon = ({ type }: { type: string }) => {
        const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || FileText
        return <Icon className="h-4 w-4" />
    }

    const handleViewDocument = async (doc: Document) => {
        try {
            const supabase = createClient()
            let path = getPathFromUrl(doc.url)
            if (!path) return

            const { data, error } = await supabase
                .storage
                .from('patient-documents')
                .createSignedUrl(path, 60)

            if (error) throw new Error(error.message)

            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank')
            }
        } catch (error) {
            console.error("Error getting signed URL:", error)
            toast.error("No se pudo abrir el documento")
        }
    }

    const handleDownloadDocument = async (doc: Document) => {
        try {
            toast.loading("Descargando documento...", { id: "download-toast" })
            const supabase = createClient()
            let path = getPathFromUrl(doc.url)
            if (!path) return

            const { data, error } = await supabase
                .storage
                .from('patient-documents')
                .download(path)

            if (error) throw new Error(error.message)

            // Create blob url and download
            const url = window.URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Documento descargado", { id: "download-toast" })
        } catch (error) {
            console.error("Error downloading:", error)
            toast.error("Error al descargar el documento", { id: "download-toast" })
        }
    }


    const handleRegenerate = (doc: Document) => {
        if (onCreateDocument) {
            const templateId = doc.metadata?.template_id
            const customNotes = doc.metadata?.custom_notes

            if (templateId) {
                toast.info("Regenerando documento (versión actualizada)...")
                onCreateDocument({ templateId, customNotes, step: 3 })
            } else {
                toast.info("Generando nuevo documento...")
                onCreateDocument()
            }
        }
    }

    const handleSendEmail = async () => {
        if (!emailDoc || !patientEmail) return

        setIsSending(true)
        try {
            const supabase = createClient()
            let path = getPathFromUrl(emailDoc.url)

            // Generate a longer lived signed url for the email (e.g. 24h) or use public if it was public (it's not)
            // Ideally we send the file as attachment, but for now we send a link.
            // If mocking, we just pass the simulation.

            const result = await sendDocumentByEmail(patientEmail, emailDoc.url, emailDoc.name)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Documento enviado a ${patientEmail}`)
                setEmailDoc(null)
            }
        } catch (error) {
            toast.error("Error al enviar el email")
        } finally {
            setIsSending(false)
        }
    }

    const getPathFromUrl = (url: string) => {
        if (url.includes("patient-documents/")) {
            return decodeURIComponent(url.split("patient-documents/")[1])
        }
        toast.error("Formato de URL inválido")
        return null
    }

    const getExpirationStatus = (expiresAt?: string) => {
        if (!expiresAt) return null
        const now = new Date()
        const expiry = new Date(expiresAt)
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { label: "CADUCADO", color: "bg-red-100 text-red-700 border-red-200" }
        if (diffDays <= 30) return { label: `RENOVAR (${diffDays}d)`, color: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" }
        return null
    }

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No hay documentos</h3>
                <p className="text-slate-500">Este paciente no tiene documentos adjuntos.</p>
            </div>
        )
    }

    // General upload (new document)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !patientId) return

        setIsUploading(true)
        try {
            const supabase = createClient()

            // Format filename: DocumentName_CIP_Date.pdf
            // We use the original name but sanitized
            const today = new Date()
            const day = String(today.getDate()).padStart(2, '0')
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const year = today.getFullYear()
            const dateStr = `${day}_${month}_${year}`

            const sanitizedOriginalName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const sanitizedCip = (patientCip || patientId).replace(/[^a-z0-9]/gi, '_')
            const fileExt = file.name.split('.').pop()

            const fileName = `${sanitizedOriginalName}_${sanitizedCip}_${dateStr}.${fileExt}`
            const filePath = `${sanitizedCip}/${fileName}`

            // Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('patient-documents')
                .upload(filePath, file)

            if (uploadError) throw new Error(uploadError.message)

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('patient-documents').getPublicUrl(filePath)

            // Insert into Database
            const { error: dbError } = await supabase.from('patient_documents').insert({
                patient_id: patientId,
                name: file.name, // Display name
                url: publicUrl,
                type: 'otro', // Default type for uploaded files
                is_signed: false
            })

            if (dbError) throw new Error(dbError.message)

            toast.success("Documento subido correctamente")
            router.refresh()
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(error.message || "Error al subir el documento")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    // Upload signed version for specific document
    const handleUploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activeDocForUpload) return

        setIsUploading(true)
        try {
            const supabase = createClient()
            const doc = activeDocForUpload

            // We upload the new signed file. 
            // We could overwrite the existing file path or create a new one.
            // Creating a new one is safer to avoid cache issues and keep history if needed (though we replace URL).
            // Let's maximize safety by adding _signed suffix.

            const today = new Date()
            const dateStr = `${String(today.getDate()).padStart(2, '0')}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}`
            const fileExt = file.name.split('.').pop() || 'pdf'

            // Try to keep original name base if possible, or use doc name
            const sanitizedDocName = doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const fileName = `${sanitizedDocName}_SIGNED_${dateStr}.${fileExt}`
            const filePath = `${doc.url.split('/').slice(-2)[0]}/${fileName}` // Attempt to put in same CIP folder

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('patient-documents')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw new Error(uploadError.message)

            const { data: { publicUrl } } = supabase.storage.from('patient-documents').getPublicUrl(filePath)

            // Update Database Record
            const { error: dbError } = await supabase
                .from('patient_documents')
                .update({
                    url: publicUrl,
                    is_signed: true,
                    signed_at: new Date().toISOString()
                })
                .eq('id', doc.id)

            if (dbError) throw new Error(dbError.message)

            toast.success("Documento firmado subido correctamente")
            router.refresh()
        } catch (error: any) {
            console.error("Signed upload error:", error)
            toast.error("Error al subir el documento firmado")
        } finally {
            setIsUploading(false)
            setActiveDocForUpload(null)
            if (signedFileInputRef.current) {
                signedFileInputRef.current.value = ""
            }
        }
    }

    const triggerUploadSigned = (doc: Document) => {
        setActiveDocForUpload(doc)
        setTimeout(() => signedFileInputRef.current?.click(), 0)
    }

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('todos')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'todos'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Todos
                </button>
                <button
                    onClick={() => setActiveTab('generados')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'generados'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Generados
                </button>
                <button
                    onClick={() => setActiveTab('aportados')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'aportados'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Aportados
                </button>
                <button
                    onClick={() => setActiveTab('pendientes')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'pendientes'
                            ? "border-amber-500 text-amber-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Pendientes
                </button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar documentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                    />

                    {/* Hidden input for signed document replacement */}
                    <input
                        type="file"
                        ref={signedFileInputRef}
                        className="hidden"
                        onChange={handleUploadSigned}
                        accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                        title="Subir documento existente"
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>

                    {onCreateDocument && (
                        <Button
                            onClick={() => onCreateDocument?.()}
                            size="icon"
                            className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            title="Crear nuevo documento"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Vencimiento</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                <TypeIcon type={doc.type} />
                                            </div>
                                            {doc.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                                            {TYPE_LABELS[doc.type as keyof typeof TYPE_LABELS] || doc.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {['informe', 'receta', 'consentimiento'].includes(doc.type) ? (
                                            doc.is_signed ? (
                                                <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    FIRMADO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                                    PENDIENTE
                                                </span>
                                            )
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        {doc.expires_at && ['informe', 'receta', 'consentimiento'].includes(doc.type) ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-600">
                                                    {new Date(doc.expires_at).toLocaleDateString()}
                                                </span>
                                                {getExpirationStatus(doc.expires_at) && (
                                                    <span className={cn(
                                                        "inline-flex items-center w-fit px-2 py-0.5 rounded text-[9px] font-bold border",
                                                        getExpirationStatus(doc.expires_at)?.color
                                                    )}>
                                                        {getExpirationStatus(doc.expires_at)?.label}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">---</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                onClick={() => handleViewDocument(doc)}
                                                title="Ver documento"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                onClick={() => handleDownloadDocument(doc)}
                                                title="Descargar"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => patientEmail ? setEmailDoc(doc) : toast.error("El paciente no tiene email registrado")}
                                                title="Enviar por email"
                                            >
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            {['informe', 'receta', 'consentimiento'].includes(doc.type) && (!doc.is_signed || (doc.expires_at && new Date(doc.expires_at) < new Date())) && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => triggerUploadSigned(doc)}
                                                        title="Subir documento firmado (Reemplazar)"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                        onClick={() => handleRegenerate(doc)}
                                                        title="Regenerar con nuevas fechas"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AlertDialog open={!!emailDoc} onOpenChange={(open) => !open && setEmailDoc(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Enviar documento por email</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres enviar el documento <strong>{emailDoc?.name}</strong> a la dirección <strong>{patientEmail}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleSendEmail(); }} disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                            {isSending ? "Enviando..." : "Enviar Email"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
