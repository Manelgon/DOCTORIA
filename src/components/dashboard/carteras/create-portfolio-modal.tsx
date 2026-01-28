"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, Loader2, Briefcase, FileText } from "lucide-react"
import { createCartera } from "@/app/dashboard/actions/carteras"
import { toast } from "sonner"

export function CreatePortfolioModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        try {
            const result = await createCartera(formData)
            if (result?.error) {
                setError(result.error)
                toast.error("Error al crear cartera", { description: result.error })
                setIsPending(false)
            } else {
                // Portfolio created!
                toast.success("Cartera creada correctamente")

                // Check if sharing was attempted
                if (result.shareResult) {
                    if (result.shareResult.success) {
                        toast.success("Invitación enviada", {
                            description: `Se ha compartido el acceso con ${formData.get("shareEmail")}`
                        })
                    } else {
                        toast.error("Error al compartir", {
                            description: result.shareResult.error || "No se pudo enviar la invitación al profesional."
                        })
                    }
                }

                setIsOpen(false)
                setIsPending(false)
            }
        } catch (e) {
            console.error(e)
            setError("Ocurrió un error inesperado.")
            toast.error("Error inesperado")
            setIsPending(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
                <Plus className="h-5 w-5" />
                Nueva Cartera
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
                className="bg-white border-slate-200 w-full max-w-lg relative animate-in zoom-in-95 duration-200 overflow-hidden h-full sm:h-auto rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl border-0 sm:border"
            >
                {/* HEADER */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                        Nueva Cartera de Clientes
                    </h2>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre" className="text-slate-700 font-semibold flex items-center gap-2 italic">
                                Nombre de la Cartera
                            </Label>
                            <Input
                                id="nombre"
                                name="nombre"
                                placeholder="Ej: Pacientes Mutua Madrileña"
                                required
                                className="h-12 rounded-xl font-bold text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion" className="text-slate-700 font-semibold flex items-center gap-2 italic">
                                <FileText className="h-4 w-4 text-slate-400" /> Descripción (Opcional)
                            </Label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                rows={3}
                                placeholder="Notas adicionales sobre este grupo de pacientes..."
                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="shareEmail" className="text-sm font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Compartir al crear (Opcional)
                                </Label>
                            </div>

                            <div className="space-y-2">
                                <Input
                                    id="shareEmail"
                                    name="shareEmail"
                                    type="email"
                                    placeholder="profesional@doctoria.es"
                                    className="h-11 rounded-xl"
                                />
                                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                    <p className="text-[10px] text-blue-700 leading-relaxed italic">
                                        * Introduzca el email de otro profesional para darle acceso inmediato a esta cartera. Se le notificará automáticamente.
                                    </p>
                                </div>
                            </div>
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
                                Creando y compartiendo...
                            </>
                        ) : (
                            "Confirmar y Crear Cartera"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
