"use client"

import { Activity, AlertCircle, CheckCircle2, FileText, Droplets, Contact, History, ShieldAlert, Pill } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertBubbleProps {
    icon: React.ElementType
    label: string
    value: string | number
    colorClass: string
    details?: string[]
}

function AlertBubble({ icon: Icon, label, value, colorClass, details }: AlertBubbleProps) {
    if (!value || (typeof value === 'number' && value === 0)) return null

    return (
        <div className="group relative">
            <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-default",
                colorClass
            )}>
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-black uppercase tracking-tight">{value}</span>
            </div>

            {/* Tooltip / Popover */}
            {details && details.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-50 origin-top">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                        <Icon className={cn("h-4 w-4", colorClass.split(' ')[1])} />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
                    </div>
                    <div className="space-y-2">
                        {details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5", colorClass.split(' ')[0].replace('bg-', 'bg-').replace('border-', 'bg-'))} />
                                <p className="text-xs font-bold text-slate-700 leading-tight">{detail}</p>
                            </div>
                        ))}
                    </div>
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-t border-l border-slate-100 rotate-45" />
                </div>
            )}
        </div>
    )
}

export function PatientAlerts({ patient, antecedents, allergies, treatments }: any) {
    // Prepare personal data details
    const personalDataDetails = []

    // Add phone numbers
    if (patient.phone) {
        personalDataDetails.push(`Tel: ${patient.phone_prefix || ''} ${patient.phone}`)
    }
    if (patient.phone_2) {
        personalDataDetails.push(`Tel 2: ${patient.phone_prefix_2 || ''} ${patient.phone_2}`)
    }

    // Add address
    if (patient.street) {
        const address = `${patient.street_type || ''} ${patient.street}, ${patient.street_number || ''}${patient.floor ? ` - ${patient.floor}` : ''}${patient.door ? ` ${patient.door}` : ''}`
        personalDataDetails.push(`Dir: ${address}`)
        if (patient.zip_code || patient.city) {
            personalDataDetails.push(`${patient.zip_code || ''} ${patient.city || ''}`)
        }
    } else if (patient.address) {
        personalDataDetails.push(`Dir: ${patient.address}`)
    }

    // Add DNI
    if (patient.dni) {
        personalDataDetails.push(`DNI: ${patient.dni}`)
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mt-3">
            <AlertBubble
                icon={Contact}
                label="Datos Personales"
                value="📋"
                colorClass="bg-slate-50 text-slate-600 border-slate-200"
                details={personalDataDetails}
            />

            <AlertBubble
                icon={Droplets}
                label="Grupo Sanguíneo"
                value={patient.blood_group || '??'}
                colorClass="bg-red-50 text-red-600 border-red-100"
                details={patient.blood_group ? [`Factor Rh: ${patient.blood_group.includes('+') ? 'Positivo' : 'Negativo'}`] : []}
            />

            <AlertBubble
                icon={History}
                label="Antecedentes"
                value={antecedents.length}
                colorClass="bg-indigo-50 text-indigo-600 border-indigo-100"
                details={antecedents.map((a: any) => a.value)}
            />

            <AlertBubble
                icon={ShieldAlert}
                label="Alergias"
                value={allergies.length}
                colorClass="bg-rose-50 text-rose-600 border-rose-100"
                details={allergies.map((a: any) => `${a.value}${a.status ? ` (${a.status})` : ''}`)}
            />

            <AlertBubble
                icon={Pill}
                label="Tratamientos"
                value={treatments.length}
                colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
                details={treatments.map((t: any) => t.value)}
            />
        </div>
    )
}
