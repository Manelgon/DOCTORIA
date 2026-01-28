"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Calendar,
    Users,
    ClipboardList,
    Pill,
    TestTube,
    FileText,
    LayoutDashboard,
    Settings,
    LogOut,
    Briefcase
} from "lucide-react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const doctorNavigation = [
    { name: "Agenda", href: "/dashboard", icon: Calendar },
    { name: "Carteras", href: "/dashboard/carteras", icon: Briefcase },
    { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
    { name: "Consultas", href: "/dashboard/consultas", icon: ClipboardList },
    { name: "Recetas (REMPe)", href: "/dashboard/recetas", icon: Pill },
    { name: "Pruebas", href: "/dashboard/pruebas", icon: TestTube },
    { name: "Documentos", href: "/dashboard/documentos", icon: FileText },
]

const adminNavigation = [
    { name: "Profesionales", href: "/admin/medicos", icon: Users },
    { name: "Carteras", href: "/admin/carteras", icon: Briefcase },
]

import { logout } from "@/app/auth/actions"

export function Sidebar() {
    const pathname = usePathname()
    const [role, setRole] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Priority 1: Metadata (Instant, no recursion)
                const metadataRole = user.user_metadata?.role

                if (metadataRole) {
                    setRole(metadataRole)
                }

                // Priority 2: Profile DB (Verify, but handle errors gracefully)
                try {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile && !error) {
                        setRole(profile.role)
                    }
                } catch (e) {
                    console.warn("Sidebar: DB role fetch failed, staying with metadata.", e)
                }
            }
        }
        fetchRole()
    }, [supabase])

    // Avoid flicker: If role is null, show a skeleton or nothing
    if (role === null) {
        return <div className="h-screen w-64 bg-slate-900" />
    }

    const navigation = role === 'admin' ? adminNavigation : doctorNavigation

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
            <div className="flex h-20 items-center justify-center border-b border-slate-800">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    DOCTORIA<span className="text-blue-500">.</span>
                </h1>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-6">
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                    {role === 'admin' ? 'Panel de Control' : 'Menu Médico'}
                </p>
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t border-slate-800 p-4">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-400" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    )
}
