"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, User, X, Loader2, Contact, Briefcase, Activity, MapPin, Smartphone, Droplets, PlusCircle, Trash2, Pencil, Calendar, Mail } from "lucide-react"
import { updatePaciente } from "@/app/dashboard/actions/patients"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ProvinceSelect } from "@/components/dashboard/pacientes/province-select"
import { CarteraSelect } from "@/components/dashboard/pacientes/cartera-select"
import { BloodGroupSelect } from "@/components/dashboard/pacientes/blood-group-select"
import { StreetTypeSelect } from "@/components/dashboard/pacientes/street-type-select"
import { PhonePrefixSelect } from "@/components/dashboard/pacientes/phone-prefix-select"
import { SexSelect } from "@/components/dashboard/pacientes/sex-select"

interface Cartera {
    id: string
    nombre: string
}

interface EditPatientModalProps {
    patient: any
    carteras: Cartera[]
    trigger?: React.ReactNode
    onOpenChange?: (open: boolean) => void
}

interface HistoryEntry {
    type: 'antecedente' | 'alergia' | 'tratamiento'
    value: string
    status?: 'Sospecha' | 'Activa' | 'Inactiva'
    comment?: string
}

const ALLERGY_STATUSES = [
    { label: 'Sospecha', value: 'Sospecha', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { label: 'Activa', value: 'Activa', color: 'bg-red-100 text-red-700 border-red-200' },
    { label: 'Inactiva', value: 'Inactiva', color: 'bg-slate-100 text-slate-700 border-slate-200' }
] as const

import { AllergySelect } from "@/components/dashboard/pacientes/allergy-select"
import { cn } from "@/lib/utils"

export function EditPatientModal({ patient, carteras, trigger, onOpenChange }: EditPatientModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [history, setHistory] = useState<HistoryEntry[]>([])

    // Update internal state when patient prop changes or modal opens
    useEffect(() => {
        if (patient) {
            setIsOpen(true)
            setHistory(patient.medical_history || [])
        } else {
            setIsOpen(false)
        }
    }, [patient])

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        onOpenChange?.(open)
        if (open && patient) {
            setHistory(patient.medical_history || [])
        }
    }

    const addHistoryEntry = () => {
        setHistory([...history, { type: 'antecedente', value: '', status: 'Activa' }])
    }

    const updateHistoryEntry = (index: number, field: keyof HistoryEntry, val: string) => {
        const newHistory = [...history]
        newHistory[index] = { ...newHistory[index], [field]: val }
        setHistory(newHistory)
    }

    const removeHistoryEntry = (index: number) => {
        setHistory(history.filter((_, i) => i !== index))
    }

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)

        if (patient) {
            formData.append("id", patient.id)
        }

        formData.append("medical_history", JSON.stringify(history.filter(h => h.value.trim() !== "")))

        try {
            const result = await updatePaciente(formData)
            if (result?.error) {
                setError(result.error)
                toast.error("Error al actualizar paciente", { description: result.error })
                setIsPending(false)
            } else {
                handleOpenChange(false)
                setIsPending(false)
                toast.success("Paciente actualizado correctamente")
            }
        } catch (e) {
            console.error(e)
            setError("Ocurrió un error inesperado al actualizar.")
            toast.error("Error inesperado")
            setIsPending(false)
        }
    }

    if (!isOpen) {
        if (trigger) {
            // Clone trigger to attach click handler properly if it's a valid React element
            return (
                <div onClick={(e) => {
                    e.stopPropagation()
                    // Don't prevent default here to allow dropdown to process if needed, 
                    // but usually for dropdown items we want to handle the click manually.
                    // Actually, for dropdown items, better to control state from outside or simply click.
                    handleOpenChange(true)
                }}>
                    {trigger}
                </div>
            )
        }
        return (
            <Button
                onClick={() => handleOpenChange(true)}
                variant="outline"
                size="sm"
            >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
            </Button>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
                e.stopPropagation()
                // handleOpenChange(false) // Optional: close on backdrop click? Maybe safer not to to avoid data loss
            }}
        >
            {/* Backdrop click handler separately if needed, or just close button */}
            <form
                action={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border-slate-200 w-full max-w-3xl flex flex-col relative animate-in zoom-in-95 duration-200 h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl border-0 sm:border"
            >
                {/* HEADER */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-none bg-slate-50/50 rounded-none sm:rounded-t-3xl">
                    <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <Pencil className="h-6 w-6 text-blue-600" />
                        Editar Ficha de Paciente
                    </h2>
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* SECCIÓN 1: CARTERA Y PERSONAL */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Asignación de Cartera
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="cartera_id" className="text-slate-700 font-semibold italic">Cartera de Destino</Label>
                                <CarteraSelect carteras={carteras} defaultValue={patient.cartera_id} required />
                            </div>
                        </div>

                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 pt-2">
                            <UserPlus className="h-4 w-4" /> Datos Personales
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="nombre" className="text-slate-700 font-semibold italic">Nombre</Label>
                                <Input id="nombre" name="nombre" defaultValue={patient.nombre} required className="h-12 rounded-xl text-base font-bold text-slate-900" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="apellido1" className="text-slate-700 font-semibold italic">Primer Apellido</Label>
                                <Input id="apellido1" name="apellido1" defaultValue={patient.apellido1} required className="h-11 rounded-xl" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="apellido2" className="text-slate-700 font-semibold italic">Segundo Apellido</Label>
                                <Input id="apellido2" name="apellido2" defaultValue={patient.apellido2} required className="h-11 rounded-xl" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email_readonly" className="text-slate-700 font-semibold italic flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" /> Email de Acceso (Solo Lectura)
                                </Label>
                                <Input
                                    id="email_readonly"
                                    value={patient.email}
                                    readOnly
                                    disabled
                                    className="h-11 rounded-xl text-sm font-medium bg-slate-50 text-slate-500"
                                />
                                <input type="hidden" name="email" value={patient.email} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dni" className="text-slate-700 font-semibold italic">DNI / NIE / Pasaporte</Label>
                                <Input id="dni" name="dni" defaultValue={patient.dni} required className="h-11 rounded-xl" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blood_group" className="text-slate-700 font-semibold italic flex items-center gap-2">
                                    <Droplets className="h-4 w-4 text-red-500" /> Grupo Sanguíneo
                                </Label>
                                <BloodGroupSelect defaultValue={patient.blood_group} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sexo" className="text-slate-700 font-semibold italic flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" /> Sexo
                                </Label>
                                <SexSelect defaultValue={patient.sexo} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Contact className="h-4 w-4" /> Datos de Contacto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="birth_date" className="text-slate-700 font-semibold italic flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-400" /> Fecha de Nacimiento
                                </Label>
                                <Input id="birth_date" name="birth_date" type="date" defaultValue={patient.birth_date} required className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-6 md:col-span-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-700 font-semibold italic flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-slate-400" /> Teléfono Principal
                                        </Label>
                                        <div className="flex gap-2">
                                            <PhonePrefixSelect name="phone_prefix" defaultValue={patient.phone_prefix || "+34"} />
                                            <Input id="phone" name="phone" type="tel" defaultValue={patient.phone || ''} className="h-11 rounded-xl flex-1" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone_2" className="text-slate-700 font-semibold italic flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-slate-400" /> Teléfono Secundario
                                        </Label>
                                        <div className="flex gap-2">
                                            <PhonePrefixSelect name="phone_prefix_2" defaultValue={patient.phone_prefix_2 || "+34"} />
                                            <Input id="phone_2" name="phone_2" type="tel" defaultValue={patient.phone_2 || ''} placeholder="Ej: Fijo o Familiar" className="h-11 rounded-xl flex-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="space-y-6 md:col-span-2 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Dirección Postal
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    {/* Row 1: Location */}
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="province" className="text-slate-700 font-semibold italic text-xs">Provincia</Label>
                                        <ProvinceSelect required defaultValue={patient.province} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="city" className="text-slate-700 font-semibold italic text-xs">Ciudad / Localidad</Label>
                                        <Input id="city" name="city" defaultValue={patient.city} placeholder="Ciudad" required className="h-10 rounded-xl" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="zip_code" className="text-slate-700 font-semibold italic text-xs">C. Postal</Label>
                                        <Input id="zip_code" name="zip_code" defaultValue={patient.zip_code} placeholder="00000" required className="h-10 rounded-xl" />
                                    </div>

                                    {/* Row 2: Street Info */}
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="street_type" className="text-slate-700 font-semibold italic text-xs">Tipo de Vía</Label>
                                        <StreetTypeSelect defaultValue={patient.street_type} />
                                    </div>
                                    <div className="col-span-1 md:col-span-3 space-y-2">
                                        <Label htmlFor="street" className="text-slate-700 font-semibold italic text-xs">Nombre de la Vía</Label>
                                        <Input id="street" name="street" defaultValue={patient.street} placeholder="Ej: Gran Vía" required className="h-10 rounded-xl" />
                                    </div>
                                    <div className="col-span-1 md:col-span-1 space-y-2">
                                        <Label htmlFor="street_number" className="text-slate-700 font-semibold italic text-xs">Número</Label>
                                        <Input id="street_number" name="street_number" defaultValue={patient.street_number} placeholder="Nº" required className="h-10 rounded-xl" />
                                    </div>

                                    {/* Row 3: Details */}
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="block" className="text-slate-700 font-semibold italic text-xs">Bloque</Label>
                                        <Input id="block" name="block" defaultValue={patient.block} placeholder="Blq" className="h-10 rounded-xl" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="floor" className="text-slate-700 font-semibold italic text-xs">Piso / Planta</Label>
                                        <Input id="floor" name="floor" defaultValue={patient.floor} placeholder="Piso" className="h-10 rounded-xl" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="door" className="text-slate-700 font-semibold italic text-xs">Puerta</Label>
                                        <Input id="door" name="door" defaultValue={patient.door} placeholder="Pta" className="h-10 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: HISTORIA CLÍNICA DINÁMICA */}
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="h-4 w-4" /> Historia Clínica
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addHistoryEntry}
                                className="h-8 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 font-bold text-[11px]"
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                Añadir Campo
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                                    <p className="text-xs text-slate-400 italic">No se han añadido antecedentes ni alergias.</p>
                                </div>
                            ) : (
                                history.map((entry, idx) => (
                                    <div key={idx} className="space-y-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-28 flex-none">
                                                <Select
                                                    value={entry.type}
                                                    onValueChange={(val: 'antecedente' | 'alergia' | 'tratamiento') => updateHistoryEntry(idx, 'type', val)}
                                                >
                                                    <SelectTrigger className="h-9 border-slate-200 rounded-lg bg-white text-[11px] font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="antecedente">Antecedente</SelectItem>
                                                        <SelectItem value="alergia">Alergia</SelectItem>
                                                        <SelectItem value="tratamiento">Tratamiento</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {entry.type === 'alergia' ? (
                                                <div className="flex-1 flex items-center gap-2">
                                                    <div className="flex-1 min-w-[140px]">
                                                        <AllergySelect
                                                            value={entry.value}
                                                            onChange={(val) => updateHistoryEntry(idx, 'value', val)}
                                                        />
                                                    </div>
                                                    <div className="flex p-0.5 bg-white rounded-lg border border-slate-200 flex-none scale-90 origin-right">
                                                        {ALLERGY_STATUSES.map((status) => (
                                                            <button
                                                                key={status.value}
                                                                type="button"
                                                                onClick={() => updateHistoryEntry(idx, 'status', status.value)}
                                                                className={cn(
                                                                    "px-2 py-0.5 text-[9px] font-bold rounded-md transition-all",
                                                                    entry.status === status.value
                                                                        ? status.color + " shadow-sm"
                                                                        : "text-slate-500 hover:text-slate-700"
                                                                )}
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Input
                                                    placeholder={entry.type === 'tratamiento' ? "Ej: Metformina 850mg" : "Ej: Diabetes Tipo II"}
                                                    value={entry.value}
                                                    onChange={(e) => updateHistoryEntry(idx, 'value', e.target.value)}
                                                    className="h-9 rounded-lg flex-1 text-xs bg-white"
                                                />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => removeHistoryEntry(idx)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-none"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {entry.type === 'alergia' && (
                                            <div className="pl-[120px] animate-in slide-in-from-top-1">
                                                <Input
                                                    placeholder="Añadir comentario o reacción (opcional)..."
                                                    value={entry.comment || ""}
                                                    onChange={(e) => updateHistoryEntry(idx, 'comment', e.target.value)}
                                                    className="h-8 rounded-lg bg-white/50 text-[10px] italic border-dashed border-slate-200"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-none sm:rounded-b-3xl">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Guardando cambios...
                            </>
                        ) : (
                            "Guardar Cambios"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
