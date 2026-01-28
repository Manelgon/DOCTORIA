"use client"

import { Bell, Search, User, Check, X, Loader2, Menu, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getNotifications, markAsRead } from "@/app/dashboard/actions/notifications"
import { acceptInvitation } from "@/app/dashboard/actions/carteras"
import { toast } from "sonner"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { doctorNavigation, adminNavigation } from "@/constants/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { logout } from "@/app/auth/actions"

export function Navbar() {
    const router = useRouter()
    const [profile, setProfile] = useState<{
        nombre?: string,
        apellidos?: string,
        role: string,
        email: string
    } | null>(null)
    const [notifications, setNotifications] = useState<any[]>([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [isAccepting, setIsAccepting] = useState<string | null>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()
    const supabase = createClient()

    const fetchNotifications = async () => {
        const data = await getNotifications()
        setNotifications(data)
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const userEmail = user.email || 'Usuario'
                    const metaRole = user.user_metadata?.role || 'usuario'
                    const metaNombre = user.user_metadata?.nombre || ''
                    const metaApellidos = user.user_metadata?.apellidos || ''

                    setProfile({
                        nombre: metaNombre,
                        apellidos: metaApellidos,
                        role: metaRole,
                        email: userEmail
                    })

                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role, email, nombre, apellidos')
                        .eq('id', user.id)
                        .single()

                    if (data) {
                        setProfile({
                            nombre: data.nombre || metaNombre,
                            apellidos: data.apellidos || metaApellidos,
                            role: data.role || metaRole,
                            email: data.email || userEmail
                        })
                    }

                    // Initial fetch
                    fetchNotifications()

                    // Realtime subscription for notifications
                    const channel = supabase
                        .channel('schema-db-changes')
                        .on(
                            'postgres_changes',
                            { event: '*', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${user.id}` },
                            () => fetchNotifications()
                        )
                        .subscribe()

                    return () => {
                        supabase.removeChannel(channel)
                    }
                }
            } catch (err) {
                console.error("Navbar: Unexpected error:", err)
            }
        }
        fetchProfile()
    }, [supabase])

    const unreadCount = notifications.filter(n => !n.read).length

    const handleAccept = async (inviteId: string, notifId: string) => {
        setIsAccepting(inviteId)
        try {
            const result = await acceptInvitation(inviteId)
            if (result.success) {
                toast.success("Cartera aceptada", { description: "Ahora puedes acceder a esta cartera." })
                await markAsRead(notifId)
                fetchNotifications()
                router.refresh()
            } else {
                toast.error("Error", { description: result.error })
            }
        } catch (error) {
            toast.error("Error inesperado")
        } finally {
            setIsAccepting(null)
        }
    }

    const displayName = profile?.nombre
        ? `${profile.nombre} ${profile.apellidos || ''}`.trim()
        : profile?.email || 'Usuario'

    const formattedRole = profile?.role === 'medico' ? 'Médico General'
        : profile?.role === 'admin' ? 'Administrador'
            : profile?.role === 'paciente' ? 'Paciente'
                : profile?.role ? profile.role : 'Usuario'

    const navigation = profile?.role === 'admin' ? adminNavigation : doctorNavigation

    return (
        <>
            <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-8 sticky top-0 z-30">
                <div className="flex lg:hidden mr-4">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        DOCTORIA<span className="text-blue-500">.</span>
                    </h1>
                </div>

                <div className="hidden md:flex w-full max-w-md items-center relative">
                    <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar pacientes, citas..."
                        className="w-full rounded-full bg-slate-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>

                <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ${showNotifications ? 'bg-slate-100 text-slate-600' : ''}`}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                                        <h3 className="font-bold text-slate-900 text-sm">Notificaciones</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <p className="text-xs text-slate-400 italic">No tienes notificaciones pendientes.</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div key={n.id} className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                                                    {n.type === 'portfolio_invitation' && (
                                                        <div className="space-y-3">
                                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                                <span className="font-bold text-slate-900">{n.content.sender_name}</span> te ha invitado a compartir una cartera.
                                                            </p>
                                                            {!n.read && (
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleAccept(n.content.invite_id, n.id)}
                                                                        disabled={isAccepting === n.content.invite_id}
                                                                        className="h-7 px-3 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg gap-1"
                                                                    >
                                                                        {isAccepting === n.content.invite_id ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <Check className="h-3 w-3" />
                                                                        )}
                                                                        Aceptar
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => markAsRead(n.id)}
                                                                        className="h-7 px-3 text-[10px] text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg gap-1"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                        Descartar
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {n.read && (
                                                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">Aceptada</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="hidden sm:flex items-center space-x-3 pl-4 border-l">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                            <p className="text-xs text-slate-500 capitalize">{formattedRole}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 w-72 bg-slate-900 shadow-2xl transition-transform transform translate-x-0 animate-in slide-in-from-right duration-300">
                        <div className="flex flex-col h-full">
                            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
                                <h1 className="text-xl font-bold tracking-tight text-white">
                                    DOCTORIA<span className="text-blue-500">.</span>
                                </h1>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="flex items-center space-x-3 mb-8 pb-8 border-b border-slate-800">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border">
                                        <User className="h-7 w-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{displayName}</p>
                                        <p className="text-xs text-slate-400 capitalize">{formattedRole}</p>
                                    </div>
                                </div>

                                <nav className="space-y-2">
                                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                                        {profile?.role === 'admin' ? 'Panel de Control' : 'Menu Médico'}
                                    </p>
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={cn(
                                                    "group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-blue-600 text-white"
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
                            </div>

                            <div className="mt-auto border-t border-slate-800 p-6">
                                <button
                                    onClick={() => logout()}
                                    className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-400" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
