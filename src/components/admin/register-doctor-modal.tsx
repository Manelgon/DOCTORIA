"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, X, Loader2, Contact, Briefcase, FileText } from "lucide-react"
import { createDoctor } from "@/app/admin/actions/medicos"
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

export function RegisterDoctorModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        try {
            const result = await createDoctor(formData)
            if (result?.error) {
                setError(result.error)
                toast.error("Error al registrar", { description: result.error })
                setIsPending(false)
            } else {
                setIsOpen(false)
                setIsPending(false)
                toast.success("Profesional registrado correctamente", {
                    description: "El usuario ya está activo y puede iniciar sesión."
                })
            }
        } catch (e) {
            console.error(e)
            setError("Ocurrió un error inesperado. Por favor, revise los datos.")
            toast.error("Error inesperado")
            setIsPending(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2"
            >
                <UserPlus className="h-5 w-5" />
                Registrar Nuevo Médico
            </Button>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
        >
            <form
                action={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border-slate-200 w-full max-w-2xl flex flex-col relative animate-in zoom-in-95 duration-200 h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl border-0 sm:border"
            >
                {/* HEADER (FIXED) */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-none bg-slate-50/50 rounded-none sm:rounded-t-3xl">
                    <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                        Alta de Profesional Médico
                    </h2>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* BODY (SCROLLABLE) */}
                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* SECCIÓN 1: DATOS PERSONALES Y AVATAR */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Contact className="h-4 w-4" /> Datos Personales y Acceso
                        </h3>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <Label className="text-slate-700 font-semibold text-center w-full">Foto de Perfil</Label>
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-blue-400 transition-colors">
                                        <UserPlus className="h-8 w-8 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <input
                                        type="file"
                                        name="avatar"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">PNG, JPG hasta 2MB</p>
                            </div>

                            {/* Name Fields */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre" className="text-slate-700 font-semibold">Nombre</Label>
                                        <Input id="nombre" name="nombre" placeholder="Ej: Juan" required className="h-11 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apellidos" className="text-slate-700 font-semibold">Apellidos</Label>
                                        <Input id="apellidos" name="apellidos" placeholder="Ej: Pérez García" required className="h-11 rounded-xl" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-700 font-semibold">Correo Profesional</Label>
                                        <Input id="email" name="email" type="email" placeholder="medico@doctoria.es" required className="h-11 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-slate-700 font-semibold">Contraseña Temporal</Label>
                                        <Input id="password" name="password" type="password" required className="h-11 rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor="role" className="text-slate-700 font-semibold">Rol del Usuario</Label>
                                    <select
                                        id="role"
                                        name="role"
                                        defaultValue="medico"
                                        className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    >
                                        <option value="medico">Médico</option>
                                        <option value="admin">Administrador</option>
                                        <option value="paciente">Paciente</option>
                                    </select>
                                </div>
                            </div>
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
                                <Input id="cif" name="cif" placeholder="12345678X" className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numero_colegiado" className="text-slate-700 font-semibold">Nº Colegiado</Label>
                                <Input id="numero_colegiado" name="numero_colegiado" placeholder="00/00/0000" className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="especialidad" className="text-slate-700 font-semibold">Especialidad</Label>
                                <select
                                    id="especialidad"
                                    name="especialidad"
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
                                <Input id="telefono" name="telefono" placeholder="+34 600 000 000" className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="direccion" className="text-slate-700 font-semibold">Dirección</Label>
                                <Input id="direccion" name="direccion" placeholder="Calle, Número, Ciudad" className="h-11 rounded-xl" />
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
                                placeholder="Breve descripción del profesional para su perfil público..."
                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER (FIXED) */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex-none rounded-none sm:rounded-b-3xl">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Creando perfil médico...
                            </>
                        ) : (
                            "Confirmar Registro de Profesional"
                        )}
                    </Button>
                    <p className="text-[11px] text-slate-400 text-center italic mt-3">
                        Se enviarán las credenciales de acceso al correo electrónico proporcionado.
                    </p>
                </div>
            </form>
        </div>
    )
}
