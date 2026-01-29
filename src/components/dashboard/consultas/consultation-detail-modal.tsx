"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Activity,
    Calendar,
    ClipboardList,
    FileText,
    Stethoscope,
    Thermometer,
    Heart,
    Scale,
    User
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VitalSign {
    type: 'temperatura' | 'presion' | 'frecuencia_cardiaca' | 'sato2' | 'peso' | 'altura' | 'glucosa'
    value: string
    unit?: string
}

interface Consultation {
    id: string
    fecha: string
    diagnosis: string | null
    treatment: string | null
    notes: string | null
    aproximacion_diagnostica: string | null
    signos_vitales: VitalSign[]
    medico?: {
        nombre: string
        apellidos: string
        especialidad?: string
    }
    diagnosticos?: Array<{
        rank: number
        status: string
        catalogo: {
            display: string
            code: string
            system: string
        }
    }>
}

interface ConsultationDetailModalProps {
    consultation: Consultation | null
    isOpen: boolean
    onClose: () => void
}

const VITAL_LABELS = {
    temperatura: { label: 'Temperatura', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50/50', border: 'border-orange-200' },
    presion: { label: 'Presión Arterial', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-200' },
    frecuencia_cardiaca: { label: 'Frecuencia C.', icon: Heart, color: 'text-red-600', bg: 'bg-red-50/50', border: 'border-red-200' },
    sato2: { label: 'Saturación O2', icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50/50', border: 'border-cyan-200' },
    peso: { label: 'Peso', icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-200' },
    altura: { label: 'Altura', icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-200' },
    glucosa: { label: 'Glucosa', icon: DropletIcon, color: 'text-pink-600', bg: 'bg-pink-50/50', border: 'border-pink-200' }
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

export function ConsultationDetailModal({ consultation, isOpen, onClose }: ConsultationDetailModalProps) {
    if (!consultation) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl h-full sm:h-auto bg-white p-0 border-gray-200 shadow-sm rounded-none sm:rounded-md flex flex-col">
                <DialogHeader className="p-4 bg-gray-50 border-b border-gray-200 rounded-none sm:rounded-t-md flex-shrink-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Facultativo Responsable</p>
                                <DialogTitle className="text-base font-semibold text-slate-900 leading-tight">
                                    Dr. {consultation.medico?.nombre} {consultation.medico?.apellidos}
                                </DialogTitle>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                    {consultation.medico?.especialidad || 'Medicina General'}
                                </p>
                            </div>
                        </div>

                        <div className="hidden sm:flex flex-col items-end shrink-0">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-gray-200 bg-white">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-tight">
                                    {new Date(consultation.fecha).toLocaleDateString("es-ES", {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 mr-1">
                                {new Date(consultation.fecha).toLocaleTimeString("es-ES", {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-7 overflow-y-auto flex-1">

                    {/* Ficha de Constantes Vitales */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Signos Vitales</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {consultation.signos_vitales && consultation.signos_vitales.length > 0 ? (
                                consultation.signos_vitales.map((vital, idx) => {
                                    const config = VITAL_LABELS[vital.type as keyof typeof VITAL_LABELS] || VITAL_LABELS.presion
                                    return (
                                        <div key={idx} className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{config.label}</p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {vital.value} <span className="text-[10px] text-slate-500">{vital.unit}</span>
                                            </p>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-xs text-slate-500 italic">No se registraron signos vitales</p>
                            )}
                        </div>
                    </div>

                    {/* Diagnóstico CIE-10 / SNOMED */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <ClipboardList className="h-4 w-4 text-blue-600" />
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Diagnóstico Codificado</h3>
                        </div>

                        <div className="space-y-2">
                            {consultation.diagnosticos && consultation.diagnosticos.length > 0 ? (
                                consultation.diagnosticos
                                    .sort((a, b) => a.rank - b.rank)
                                    .map((d, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-slate-900">{d.catalogo.display}</span>
                                                    {d.rank === 1 && (
                                                        <span className="shrink-0 px-2 py-0.5 rounded border border-blue-200 bg-blue-50/50 text-[9px] font-bold text-blue-700 uppercase tracking-wider">
                                                            P
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-medium text-slate-400 font-mono">
                                                        [{d.catalogo.code}]
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-tight ml-4",
                                                d.status === 'confirmado' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    d.status === 'descartado' ? "bg-red-50 text-red-700 border-red-100" :
                                                        "bg-amber-50 text-amber-700 border-amber-100"
                                            )}>
                                                {d.status}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-xs text-slate-500 italic">No hay diagnósticos codificados para esta consulta</p>
                            )}
                        </div>
                    </div>

                    {/* Notas de Evolución Clínica */}
                    <div className="grid grid-cols-1 gap-8">
                        {/* Motivo y Exploración */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                            <div className="space-y-1.5">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ClipboardList className="h-3 w-3" /> Motivo Principal
                                </h4>
                                <div className="text-sm font-semibold text-slate-900 leading-snug">
                                    {consultation.diagnosis || '---'}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-3 w-3" /> Exploración Física
                                </h4>
                                <div className="text-sm text-slate-600 leading-snug italic whitespace-pre-wrap">
                                    {consultation.notes || '---'}
                                </div>
                            </div>
                        </div>

                        {/* Juicio y Plan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                            <div className="space-y-1.5">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Stethoscope className="h-3 w-3" /> Aproximación Diagnóstica
                                </h4>
                                <div className="text-sm font-semibold text-slate-900 leading-snug">
                                    {consultation.aproximacion_diagnostica || '---'}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                    <ClipboardList className="h-3 w-3" /> Plan de Tratamiento
                                </h4>
                                <div className="text-sm font-semibold text-emerald-900 leading-snug bg-emerald-50/20 p-3 rounded border border-emerald-100/30 whitespace-pre-wrap">
                                    {consultation.treatment || '---'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
