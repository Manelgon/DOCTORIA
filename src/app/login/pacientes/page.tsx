import { login } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCircle, ArrowRight, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default async function PacientesLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = await searchParams

    return (
        <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
                        <UserCircle className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Portal Paciente
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium">
                        Gestione sus citas, recetas e informes
                    </p>
                </div>

                <form action={login} className="space-y-6 mt-8" autoComplete="off">
                    <input type="hidden" name="role" value="paciente" />

                    {error && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 py-3 flex items-center">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="font-medium leading-none">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@correo.com"
                            required
                            autoComplete="off"
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Contraseña</Label>
                            <a href="#" className="text-xs text-blue-600 hover:underline">
                                ¿Olvidó su contraseña?
                            </a>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="flex flex-col space-y-4 pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                        >
                            Entrar al Portal
                        </Button>
                    </div>
                </form>

                <div className="text-center mt-8 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        ¿Es usted un profesional? <br />
                        <Link href="/login/profesionales" className="text-blue-600 font-semibold hover:underline inline-flex items-center mt-1">
                            Acceso Profesionales <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
