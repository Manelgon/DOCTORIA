"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Activity, PlusCircle, Trash2, Thermometer, Heart, FileText, Stethoscope } from "lucide-react"
import { createConsulta } from "@/app/dashboard/actions/consultations"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DiagnosticSelector, SelectedDiagnostic } from "./diagnostic-selector"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface VitalSign {
    type: 'temperatura' | 'presion_sistolica' | 'presion_diastolica' | 'frecuencia_cardiaca' | 'sato2' | 'glucosa'
    value: string
    unit?: string
}

const VITAL_TYPES = {
    temperatura: { label: 'Temperatura', unit: 'ºC', icon: Thermometer },
    presion_sistolica: { label: 'Presión Arterial Sistólica', unit: 'mmHg', icon: Activity },
    presion_diastolica: { label: 'Presión Arterial Diastólica', unit: 'mmHg', icon: Activity },
    frecuencia_cardiaca: { label: 'Frecuencia Cardíaca', unit: 'bpm', icon: Heart },
    sato2: { label: 'Saturación O2', unit: '%', icon: Activity },
    glucosa: { label: 'Glucosa', unit: 'mg/dL', icon: DropletIcon }
}

function DropletIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        </svg>
    )
}

export function CreateConsultationForm({ patientId, doctorProfile }: { patientId: string, doctorProfile: any }) {
    const [isPending, setIsPending] = useState(false)
    const [vitals, setVitals] = useState<VitalSign[]>([
        { type: 'temperatura', value: '', unit: 'ºC' },
        { type: 'presion_sistolica', value: '', unit: 'mmHg' },
        { type: 'presion_diastolica', value: '', unit: 'mmHg' },
        { type: 'frecuencia_cardiaca', value: '', unit: 'bpm' },
        { type: 'sato2', value: '', unit: '%' },
        { type: 'glucosa', value: '', unit: 'mg/dL' }
    ])
    const [selectedDiagnostics, setSelectedDiagnostics] = useState<SelectedDiagnostic[]>([])
    const router = useRouter()

    const updateVital = (index: number, val: string) => {
        const newVitals = [...vitals]
        newVitals[index] = { ...newVitals[index], value: val }
        setVitals(newVitals)
    }

    async function handleSubmit(formData: FormData) {
        setIsPending(true)

        formData.append("patient_id", patientId)
        formData.append("signos_vitales", JSON.stringify(vitals.filter(v => v.value.trim() !== "")))
        formData.append("diagnosticos_json", JSON.stringify(selectedDiagnostics))

        try {
            const result = await createConsulta(formData)
            if (result?.error) {
                toast.error("Error al crear consulta", { description: result.error })
            } else {
                toast.success("Consulta creada correctamente")
                router.push(`/dashboard/pacientes/${patientId}`)
                router.refresh()
            }
        } catch (e) {
            console.error(e)
            toast.error("Error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">


            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Diagnóstico */}
                <div className="bg-white border border-slate-200 p-4">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">DIAGNÓSTICO (CIE-10)</h3>
                    <div className="h-px bg-slate-200 mb-4"></div>
                    <DiagnosticSelector onSelectionChange={setSelectedDiagnostics} />
                </div>

                {/* Right Column - Motivo */}
                <div className="bg-white border border-slate-200 p-4">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">MOTIVO DE CONSULTA</h3>
                    <div className="h-px bg-slate-200 mb-4"></div>
                    <Input
                        id="diagnosis"
                        name="diagnosis"
                        placeholder="Ej: Rinofaringitis Aguda"
                        className="h-9 rounded border-slate-300 text-sm mt-1"
                    />
                </div>
            </div>

            {/* Two Column Layout - Exploración y Signos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Hallazgos */}
                <div className="bg-white border border-slate-200 p-4">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">EXPLORACIÓN FÍSICA</h3>
                    <div className="h-px bg-slate-200 mb-4"></div>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Observaciones de la exploración física..."
                        className="min-h-[120px] rounded border-slate-300 resize-none text-sm mt-1"
                    />
                </div>

                {/* Right Column - Signos Vitales */}
                <div className="bg-white border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">SIGNOS VITALES</h3>
                    </div>
                    <div className="h-px bg-slate-200 mb-4"></div>

                    <div className="space-y-2">
                        {vitals.map((vital, idx) => {
                            const vitalConfig = VITAL_TYPES[vital.type as keyof typeof VITAL_TYPES]
                            const TypeIcon = vitalConfig?.icon || Activity
                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-48 flex-none bg-gray-50 border border-slate-200 rounded px-2 py-1 flex items-center gap-2">
                                        <TypeIcon className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-tight">
                                            {vitalConfig?.label}
                                        </span>
                                    </div>
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={vital.value}
                                            onChange={(e) => updateVital(idx, e.target.value)}
                                            className="h-8 rounded text-xs pr-12 border-slate-300"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">
                                            {vital.unit}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Full Width - Juicio Clínico */}
            <div className="bg-white border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">APROXIMACIÓN DIAGNÓSTICA</h3>
                <div className="h-px bg-slate-200 mb-4"></div>
                <Textarea
                    id="aproximacion_diagnostica"
                    name="aproximacion_diagnostica"
                    placeholder="Juicio clínico preliminar..."
                    className="min-h-[70px] rounded border-slate-300 resize-none text-sm mt-1"
                />
            </div>

            {/* Full Width - Plan de Tratamiento */}
            <div className="bg-white border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">PLAN DE TRATAMIENTO</h3>
                <div className="h-px bg-slate-200 mb-4"></div>
                <Textarea
                    id="treatment"
                    name="treatment"
                    placeholder="Pautas, medicación y recomendaciones..."
                    className="min-h-[80px] rounded border-slate-300 resize-none text-sm mt-1"
                />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded border-slate-300 text-slate-600 hover:bg-slate-50 px-6 text-sm font-medium"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="h-9 rounded bg-slate-700 hover:bg-slate-800 text-white px-6 text-sm font-medium"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                            Guardando...
                        </>
                    ) : (
                        'Guardar consulta'
                    )}
                </Button>
            </div>
        </form>
    )
}
