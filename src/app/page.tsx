import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Stethoscope, UserCircle, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ error?: string, error_description?: string }>
}) {
    const { error, error_description } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <main className="flex min-h-screen flex-col bg-slate-50">
            {/* Header / Nav */}
            <nav className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">DOCTORIA</span>
                </div>
                <div>
                    {!user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/login/profesionales" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                                Soy Profesional
                            </Link>
                            <Link href="/login/pacientes">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Acceso Pacientes</Button>
                            </Link>
                        </div>
                    ) : (
                        <Link href="/dashboard">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Ir al Dashboard</Button>
                        </Link>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-8 animate-in fade-in duration-700">
                <div className="space-y-4 max-w-3xl">
                    {error && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 py-3 flex items-center mb-6 max-w-lg mx-auto">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="font-medium ml-2">
                                {error_description || "Ocurrió un error al verificar su cuenta. Es posible que el enlace haya expirado."}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 mb-4 uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3" />
                        Plataforma de Gestión Clínica
                    </div>
                    <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        La forma más inteligente de gestionar su <span className="text-blue-600">consulta médica.</span>
                    </h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                        Todo lo que necesita para su práctica clínica: agenda, pacientes, recetas electrónicas y gestión documental en un solo lugar.
                    </p>
                </div>

                {/* Main Action Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-8">
                    {user ? (
                        <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-50 flex flex-col items-center space-y-6">
                            <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-10 w-10 text-blue-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-slate-900">¡Bienvenido de nuevo!</h3>
                                <p className="text-slate-500 mt-2">Su cuenta ha sido confirmada y está lista para ser utilizada.</p>
                            </div>
                            <Link href="/dashboard" className="w-full max-w-sm">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-blue-200 group transition-all">
                                    Entrar al Panel de Control
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Professional Card */}
                            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-100 hover:border-blue-300 transition-all hover:shadow-2xl hover:shadow-blue-900/10 group">
                                <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                                    <Stethoscope className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Portal Profesional</h3>
                                <p className="text-slate-500 mt-3 mb-8 leading-relaxed">
                                    Gestión integral de pacientes, informes médicos, recetas REMPe y agenda clínica avanzada.
                                </p>
                                <Link href="/login/profesionales">
                                    <Button variant="outline" className="w-full h-12 border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors mb-2">
                                        Acceso Médicos
                                    </Button>
                                </Link>
                            </div>

                            {/* Patient Card */}
                            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 hover:border-slate-300 transition-all hover:shadow-2xl hover:shadow-slate-900/5 group">
                                <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-900/20">
                                    <UserCircle className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Portal del Paciente</h3>
                                <p className="text-slate-500 mt-3 mb-8 leading-relaxed">
                                    Consulte sus recetas, descargue sus informes y gestione sus citas de forma segura.
                                </p>
                                <Link href="/login/pacientes">
                                    <Button variant="outline" className="w-full h-12 border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                        Acceso Pacientes
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <p className="text-sm text-slate-400 mt-12">
                    © 2026 DOCTORIA. Todos los derechos reservados.
                </p>
            </div>
        </main>
    )
}
