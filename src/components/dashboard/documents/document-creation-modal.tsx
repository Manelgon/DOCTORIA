"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    FileText,
    Signature,
    ChevronRight,
    ChevronLeft,
    Check,
    Download,
    Loader2,
    Calendar,
    User,
    ClipboardCheck,
    Send
} from "lucide-react"
import { SignaturePad } from "./signature-pad"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Template {
    id: string
    name: string
    description: string
    content: string
}

const DEFAULT_TEMPLATES: Template[] = [
    {
        id: "consent-general",
        name: "Consentimiento Informado General",
        description: "Documento base para procedimientos generales y tratamiento de datos.",
        content: `
            <div style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
                <h1 style="text-align: center; color: #1e40af;">CONSENTIMIENTO INFORMADO GENERAL</h1>
                <p style="text-align: right;">Fecha: <strong>{{FECHA}}</strong></p>
                <br/>
                <p>Yo, <strong>{{PACIENTE_NOMBRE}}</strong>, con DNI/NIE <strong>{{PACIENTE_DNI}}</strong>, 
                manifiesto que he sido informado por el <strong>Dr. {{MEDICO_NOMBRE}}</strong> sobre el tratamiento propuesto.</p>
                
                <p>Comprendo que la medicina no es una ciencia exacta y que no se pueden garantizar resultados específicos. 
                He tenido la oportunidad de hacer preguntas y todas mis dudas han sido resueltas.</p>
                
                <div style="margin-top: 40px; min-height: 200px; border: 1px solid #eee; padding: 15px; background: #fafafa;">
                    <p style="font-size: 12px; color: #666; font-style: italic;">Notas adicionales del facultativo:</p>
                    <p>{{NOTAS_ADICIONALES}}</p>
                </div>

                <div style="margin-top: 100px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 45%;">
                        <div id="paciente-signature-placeholder" style="height: 80px; border-bottom: 1px solid #333; margin-bottom: 5px;">
                            {{SIGNATURE_PATIENT}}
                        </div>
                        <p style="font-size: 12px; font-weight: bold;">Firma del Paciente</p>
                        <p style="font-size: 10px;">{{PACIENTE_NOMBRE}}</p>
                    </div>
                    <div style="text-align: center; width: 45%;">
                        <div id="medico-signature-placeholder" style="height: 80px; border-bottom: 1px solid #333; margin-bottom: 5px;">
                            {{SIGNATURE_DOCTOR}}
                        </div>
                        <p style="font-size: 12px; font-weight: bold;">Firma del Facultativo</p>
                        <p style="font-size: 10px;">{{MEDICO_NOMBRE}}</p>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: "report-evolucion",
        name: "Informe de Evolución Clínica",
        description: "Resumen de la evolución del paciente y plan diagnóstico.",
        content: `
             <div style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
                <h1 style="text-align: center; color: #1e40af;">INFORME CLÍNICO DE EVOLUCIÓN</h1>
                <p style="text-align: right;">Fecha: <strong>{{FECHA}}</strong></p>
                <br/>
                <p><strong>PACIENTE:</strong> {{PACIENTE_NOMBRE}}</p>
                <p><strong>Nº HISTORIA:</strong> {{PACIENTE_ID}}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                
                <h3>EVOLUCIÓN Y NOTAS</h3>
                <div style="margin-bottom: 30px;">
                    {{NOTAS_ADICIONALES}}
                </div>

                <div style="margin-top: 100px; display: flex; justify-content: flex-end;">
                    <div style="text-align: center; width: 250px;">
                        <div id="medico-signature-placeholder" style="height: 80px; border-bottom: 1px solid #333; margin-bottom: 5px;">
                            {{SIGNATURE_DOCTOR}}
                        </div>
                        <p style="font-size: 12px; font-weight: bold;">{{MEDICO_NOMBRE}}</p>
                        <p style="font-size: 10px;">Facultativo Responsable</p>
                    </div>
                </div>
            </div>
        `
    }
]

interface DocumentCreationModalProps {
    isOpen: boolean
    onClose: () => void
    patient: any
    doctor: any
    initialData?: {
        templateId?: string
        customNotes?: string
        step?: number
    }
}

export function DocumentCreationModal({ isOpen, onClose, patient, doctor, initialData }: DocumentCreationModalProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [customNotes, setCustomNotes] = useState("")
    const [patientSignature, setPatientSignature] = useState<string | null>(null)
    const [doctorSignature, setDoctorSignature] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    // Reset state on open
    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setPatientSignature(null)
            setDoctorSignature(null)

            if (initialData) {
                setStep(initialData.step || 1)
                const tmpl = DEFAULT_TEMPLATES.find(t => t.id === initialData.templateId)
                setSelectedTemplate(tmpl || null)
                setCustomNotes(initialData.customNotes || "")
            } else {
                setStep(1)
                setSelectedTemplate(null)
                setCustomNotes("")
            }
        }
    }, [isOpen, initialData])

    const generateAndSave = async (asPending: boolean = false) => {
        setIsGenerating(true)
        try {
            // Logic to generate HTML from template and placeholders
            let htmlContent = selectedTemplate?.content || ""
            htmlContent = htmlContent.replace("{{FECHA}}", new Date().toLocaleDateString())
            htmlContent = htmlContent.replace("{{PACIENTE_NOMBRE}}", `${patient.nombre} ${patient.apellidos || ''}`.trim())
            htmlContent = htmlContent.replace("{{PACIENTE_DNI}}", patient.dni || "---")
            htmlContent = htmlContent.replace("{{PACIENTE_ID}}", patient.id.substring(0, 8))
            htmlContent = htmlContent.replace("{{MEDICO_NOMBRE}}", `${doctor.nombre} ${doctor.apellidos}`)
            htmlContent = htmlContent.replace("{{NOTAS_ADICIONALES}}", customNotes || "Sin observaciones adicionales.")

            // Create a hidden div to render the document
            const renderDiv = document.createElement("div")
            renderDiv.style.position = "absolute"
            renderDiv.style.left = "-9999px"
            renderDiv.style.width = "800px" // A4 width approx
            renderDiv.innerHTML = htmlContent
            document.body.appendChild(renderDiv)

            // Inject signatures or clear placeholders
            const pSig = renderDiv.querySelector("#paciente-signature-placeholder")
            if (pSig) {
                if (patientSignature) {
                    pSig.innerHTML = `<img src="${patientSignature}" style="max-height: 80px;"/>`
                } else {
                    pSig.innerHTML = "" // Clear textual placeholder
                }
            }

            const dSig = renderDiv.querySelector("#medico-signature-placeholder")
            if (dSig) {
                if (doctorSignature) {
                    dSig.innerHTML = `<img src="${doctorSignature}" style="max-height: 80px;"/>`
                } else {
                    dSig.innerHTML = "" // Clear textual placeholder
                }
            }

            // Convert to canvas then PDF
            const canvas = await html2canvas(renderDiv, {
                scale: 2,
                logging: false,
                useCORS: true
            })

            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF("p", "mm", "a4")
            const imgProps = pdf.getImageProperties(imgData)
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)

            // Create Supabase client
            const supabase = createClient()

            // Generate filename with convention: DocumentName_CIP_Date(DD_MM_YYYY).pdf
            const today = new Date()
            const day = String(today.getDate()).padStart(2, '0')
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const year = today.getFullYear()
            const dateStr = `${day}_${month}_${year}` // DD_MM_YYYY

            const sanitizedDocName = selectedTemplate?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'documento'
            const sanitizedCip = (patient.cip || patient.id).replace(/[^a-z0-9]/gi, '_')

            const fileName = `${sanitizedDocName}_${sanitizedCip}_${dateStr}.pdf`

            // Folder structure: CIP/filename
            const filePath = `${patient.cip || patient.id}/${fileName}`

            // Convert Base64 to Blob
            const pdfBlob = pdf.output('blob')

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('patient-documents')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                })

            if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`)

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('patient-documents')
                .getPublicUrl(filePath)

            // Insert into Database
            const { error: dbError } = await supabase
                .from('patient_documents')
                .insert({
                    patient_id: patient.id,
                    name: `${selectedTemplate?.name} - ${new Date().toLocaleDateString()}`,
                    type: selectedTemplate?.id.includes('receta') ? 'receta' : 'informe',
                    url: publicUrl,
                    is_signed: !asPending,
                    signed_at: asPending ? null : new Date().toISOString(),
                    expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                    metadata: {
                        template_id: selectedTemplate?.id,
                        doctor_id: doctor.id,
                        uploaded_by: doctor.id,
                        custom_notes: customNotes
                    }
                })

            if (dbError) throw new Error(`Error al guardar en base de datos: ${dbError.message}`)

            // Cleanup & Feedback
            document.body.removeChild(renderDiv)

            if (asPending) {
                toast.success("Documento enviado para firma (guardado como pendiente)")
                // Mock email sending
                toast.info(`Solicitud de firma enviada a ${patient.email || 'paciente'}`)
            } else {
                toast.success("Documento generado, firmado y guardado correctamente")
                // Optional: Download copy for user
                pdf.save(fileName)
            }

            router.refresh()
            onClose()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al procesar el documento")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleGeneratePdf = () => generateAndSave(false)
    const handleSaveAsPending = () => generateAndSave(true)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden border-gray-200">
                <DialogHeader className="p-6 bg-slate-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                                Generar Documento Clínico
                            </DialogTitle>
                            <p className="text-xs text-slate-500 font-medium">
                                Paciente: <span className="text-slate-700">{patient.nombre} {patient.apellidos}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8">
                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-10">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                                    step === s ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-110" :
                                        step > s ? "bg-emerald-500 border-emerald-500 text-white" :
                                            "bg-white border-slate-200 text-slate-400"
                                )}>
                                    {step > s ? <Check className="h-4 w-4" /> : s}
                                </div>
                                {s < 4 && (
                                    <div className={cn(
                                        "w-12 h-0.5 mx-2 rounded",
                                        step > s ? "bg-emerald-500" : "bg-slate-100"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="min-h-[350px]">
                        {/* Step 1: Template Selection */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-bold text-slate-900">Seleccione una Plantilla</h3>
                                    <p className="text-sm text-slate-500">Elija el tipo de documento que desea generar para este paciente.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {DEFAULT_TEMPLATES.map((tmpl) => (
                                        <button
                                            key={tmpl.id}
                                            onClick={() => {
                                                setSelectedTemplate(tmpl)
                                                setStep(2)
                                            }}
                                            className={cn(
                                                "p-5 text-left rounded-xl border-2 transition-all group",
                                                selectedTemplate?.id === tmpl.id ? "border-blue-600 bg-blue-50/30" : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                                    selectedTemplate?.id === tmpl.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                                                )}>
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{tmpl.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 leading-normal">{tmpl.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Customization */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
                                        <ClipboardCheck className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{selectedTemplate?.name}</h3>
                                        <p className="text-[10px] text-slate-500 italic uppercase font-bold tracking-wider">Edición de Contenido</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Observaciones / Notas Adicionales
                                    </label>
                                    <textarea
                                        value={customNotes}
                                        onChange={(e) => setCustomNotes(e.target.value)}
                                        className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                        placeholder="Introduzca cualquier detalle específico para este documento..."
                                    />
                                    <p className="text-[10px] text-slate-400 italic">
                                        * Los datos del paciente y facultativo se autocompletarán automáticamente.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Signatures */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                <div className="text-center space-y-2 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">Captura de Firmas</h3>
                                    <p className="text-sm text-slate-500">Es necesaria la firma digital para validar el documento.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <SignaturePad
                                            label="Firma Facultativo"
                                            placeholder="Dr. {{MEDICO}}"
                                            onSave={(data) => {
                                                setDoctorSignature(data)
                                                toast.success("Firma de médico guardada")
                                            }}
                                            onClear={() => setDoctorSignature(null)}
                                        />
                                        {doctorSignature && (
                                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-100 shadow-sm animate-in zoom-in-95">
                                                <Check className="h-4 w-4" />
                                                <span className="text-xs font-bold uppercase tracking-tight">Firma Registrada</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <SignaturePad
                                            label="Firma Paciente"
                                            placeholder="Nombre del Paciente"
                                            onSave={(data) => {
                                                setPatientSignature(data)
                                                toast.success("Firma de paciente guardada")
                                            }}
                                            onClear={() => setPatientSignature(null)}
                                        />
                                        {patientSignature && (
                                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-100 shadow-sm animate-in zoom-in-95">
                                                <Check className="h-4 w-4" />
                                                <span className="text-xs font-bold uppercase tracking-tight">Firma Registrada</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Final Preview */}
                        {step === 4 && (
                            <div className="flex flex-col items-center justify-center space-y-8 h-full animate-in fade-in zoom-in-95">
                                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 shadow-lg animate-bounce">
                                    <Download className="h-10 w-10 text-emerald-600" />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-2xl font-bold text-slate-900">¡Todo Listo!</h3>
                                    <p className="text-slate-500 max-w-sm">
                                        El documento ha sido preparado con las firmas y datos proporcionados.
                                        Haga clic en el botón inferior para finalizar la generación.
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-xs text-slate-600 font-medium">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Expira el: {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-gray-100 sm:justify-between items-center">
                    <div className="hidden sm:block">
                        {step > 1 && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Paso {step} de 4
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-end">
                        <Button
                            variant="outline"
                            onClick={() => step === 1 ? onClose() : setStep(step - 1)}
                            className="bg-white border-slate-200"
                            disabled={isGenerating}
                        >
                            {step === 1 ? "Cancelar" : "Anterior"}
                        </Button>

                        {step < 4 ? (
                            step === 3 ? (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSaveAsPending}
                                        disabled={isGenerating || !doctorSignature}
                                        className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 gap-2 min-w-[140px]"
                                        title="Enviar solicitud al paciente y guardar como pendiente"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                Enviar para firmar <Send className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        disabled={!doctorSignature} // Require doctor signature at least to proceed or save
                                        onClick={() => setStep(step + 1)}
                                        className="bg-slate-800 hover:bg-slate-700 text-white gap-2"
                                    >
                                        Siguiente <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    disabled={step === 1 && !selectedTemplate}
                                    onClick={() => setStep(step + 1)}
                                    className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 gap-2"
                                >
                                    Siguiente <ChevronRight className="h-4 w-4" />
                                </Button>
                            )
                        ) : (
                            <Button
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                                className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 gap-2 min-w-[140px]"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Generando...
                                    </>
                                ) : (
                                    <>
                                        Generar Documento <Check className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
