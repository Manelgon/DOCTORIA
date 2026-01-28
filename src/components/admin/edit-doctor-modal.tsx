"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, X, Loader2, Contact, Briefcase, FileText, Save } from "lucide-react"
import { updateDoctor } from "@/app/admin/actions/medicos"
import { toast } from "sonner"

const ESPECIALIDADES = [
    "Medicina General",
    "Estética",
    "Nutrición",
    "Dermatología",
    "Ginecología",
    "Pediatría",
    "Psicología",
    "Fisioterapia",
    "Traumatología",
    "Otras"
]

interface Doctor {
    id: string
    nombre: string
    apellidos: string
    email: string
    especialidad?: string
    numero_colegiado?: string
    cif?: string
    telefono?: string
    direccion?: string
    bio?: string
    is_active?: boolean
    created_at: string
}

interface EditDoctorModalProps {
    doctor: Doctor | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditDoctorModal({ doctor, open, onOpenChange }: EditDoctorModalProps) {
    const [isPending, setIsPending] = useState(false)

    if (!open || !doctor) return null

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        try {
            const result = await updateDoctor(formData)
            if (result?.error) {
                toast.error("Error al actualizar", { description: result.error })
            } else {
                toast.success("Perfil actualizado correctamente")
                onOpenChange(false)
            }
        } catch (e) {
            toast.error("Error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <form
                action={handleSubmit}
                className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200"
            >
                <input type="hidden" name="id" value={doctor.id} />

                {/* HEADER */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-none bg-slate-50/50 rounded-t-3xl">
                    <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <EditIcon className="h-6 w-6 text-blue-600" />
                        Editar Profesional
                    </h2>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                    {/* SECCIÓN 1: DATOS PERSONALES */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Contact className="h-4 w-4" /> Datos Personales
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="text-slate-700 font-semibold">Nombre</Label>
                                <Input id="nombre" name="nombre" defaultValue={doctor.nombre} required className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apellidos" className="text-slate-700 font-semibold">Apellidos</Label>
                                <Input id="apellidos" name="apellidos" defaultValue={doctor.apellidos} required className="h-11 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2 opacity-60">
                            <Label htmlFor="email" className="text-slate-700 font-semibold">Correo Profesional (No editable)</Label>
                            <Input id="email" name="email" value={doctor.email} disabled className="h-11 rounded-xl bg-slate-50" />
                        </div>
                    </div>

                    {/* SECCIÓN 2: DATOS PROFESIONALES */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Identificación Profesional
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cif" className="text-slate-700 font-semibold">CIF / NIF</Label>
                                <Input id="cif" name="cif" defaultValue={doctor.cif} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numero_colegiado" className="text-slate-700 font-semibold">Nº Colegiado</Label>
                                <Input id="numero_colegiado" name="numero_colegiado" defaultValue={doctor.numero_colegiado} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="especialidad" className="text-slate-700 font-semibold">Especialidad</Label>
                                <select
                                    id="especialidad"
                                    name="especialidad"
                                    defaultValue={doctor.especialidad}
                                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Seleccionar...</option>
                                    {ESPECIALIDADES.map(esp => (
                                        <option key={esp} value={esp}>{esp}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: CONTACTO Y BIO */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <UserPlus className="h-4 w-4" /> Contacto y Resumen
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="telefono" className="text-slate-700 font-semibold">Teléfono</Label>
                                <Input id="telefono" name="telefono" defaultValue={doctor.telefono} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="direccion" className="text-slate-700 font-semibold">Dirección</Label>
                                <Input id="direccion" name="direccion" defaultValue={doctor.direccion} className="h-11 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2 pb-4">
                            <Label htmlFor="bio" className="text-slate-700 font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-400" /> Biografía / Resumen Curricular
                            </Label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows={4}
                                defaultValue={doctor.bio}
                                placeholder="Breve descripción del profesional..."
                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex-none rounded-b-3xl">
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
                            <>
                                <Save className="h-5 w-5" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

function EditIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    )
}
