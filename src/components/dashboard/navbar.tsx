"use client"

import { Bell, Search, User, Check, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getNotifications, markAsRead } from "@/app/dashboard/actions/notifications"
import { acceptInvitation } from "@/app/dashboard/actions/carteras"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

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

    return (
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
            <div className="flex w-full max-w-md items-center relative">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar pacientes, citas..."
                    className="w-full rounded-full bg-slate-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
            </div>
            <div className="flex items-center space-x-4">
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
                <div className="flex items-center space-x-3 pl-4 border-l">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                        <p className="text-xs text-slate-500 capitalize">{formattedRole}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border">
                        <User className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>
        </header>
    )
}
