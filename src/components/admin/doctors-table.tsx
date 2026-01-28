"use client"

import { useState, useMemo, useEffect, useTransition } from "react"
import { Stethoscope, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Columns, Check, MoreVertical, Edit, Trash2, Ban, Lock, CheckCircle, Search, Filter } from "lucide-react"
import { deleteDoctor, toggleDoctorStatus, resetDoctorPassword } from "@/app/admin/actions/medicos"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { EditDoctorModal } from "./edit-doctor-modal"
// Reverting to basic interaction as I haven't seen toast setup. I'll use standard window.confirm.

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

interface DoctorsTableProps {
    doctors: Doctor[]
    toolbarAction?: React.ReactNode
}

const ALL_COLUMNS = [
    { id: 'nombre', label: 'Profesional' },
    { id: 'especialidad', label: 'Especialidad / Colegiado' },
    { id: 'email', label: 'Contacto' },
    { id: 'cif', label: 'CIF/NIF' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'direccion', label: 'Dirección' },
    { id: 'bio', label: 'Biografía' },
    { id: 'created_at', label: 'Fecha de Alta' },
    { id: 'estado', label: 'Estado' },
    { id: 'acciones', label: 'Acciones' }
]

export function DoctorsTable({ doctors, toolbarAction }: DoctorsTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState<number | "all">(10)
    const [sortField, setSortField] = useState<keyof Doctor>("created_at")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [showColumnSelector, setShowColumnSelector] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['nombre', 'especialidad', 'email', 'created_at', 'estado', 'acciones'])

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

    // Alert Dialog States
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [resetPasswordEmail, setResetPasswordEmail] = useState<string | null>(null)
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)

    const [isPending, startTransition] = useTransition()

    // Persistence logic
    useEffect(() => {
        const saved = localStorage.getItem('table_columns_doctors')
        if (saved) {
            try {
                setVisibleColumns(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse saved columns", e)
            }
        }
    }, [])

    const toggleColumn = (columnId: string) => {
        const newVisible = visibleColumns.includes(columnId)
            ? visibleColumns.filter(id => id !== columnId)
            : [...visibleColumns, columnId]

        if (newVisible.length === 0) return

        setVisibleColumns(newVisible)
        localStorage.setItem('table_columns_doctors', JSON.stringify(newVisible))
    }

    const filteredAndSortedDoctors = useMemo(() => {
        // 1. Filter
        let result = doctors.filter(doc => {
            const fullName = `${doc.nombre} ${doc.apellidos}`.toLowerCase()
            const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                doc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.especialidad || "").toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === "all" ? true :
                statusFilter === "active" ? doc.is_active !== false :
                    doc.is_active === false

            return matchesSearch && matchesStatus
        })

        // 2. Sort
        return result.sort((a, b) => {
            let aValue = a[sortField] || ""
            let bValue = b[sortField] || ""

            if (sortField === 'nombre') {
                aValue = `${a.nombre} ${a.apellidos}`.toLowerCase()
                bValue = `${b.nombre} ${b.apellidos}`.toLowerCase()
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = bValue.toLowerCase()
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
            return 0
        })
    }, [doctors, searchTerm, statusFilter, sortField, sortDirection])

    const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredAndSortedDoctors.length / (pageSize as number))

    const paginatedDoctors = useMemo(() => {
        if (pageSize === "all") return filteredAndSortedDoctors
        const start = (currentPage - 1) * (pageSize as number)
        const end = start + (pageSize as number)
        return filteredAndSortedDoctors.slice(start, end)
    }, [filteredAndSortedDoctors, currentPage, pageSize])

    const toggleSort = (field: keyof Doctor) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const SortIcon = ({ field }: { field: keyof Doctor }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        return sortDirection === "asc"
            ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" />
            : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />
    }

    const handlePageSizeChange = (newSize: string) => {
        const val = newSize === "all" ? "all" : parseInt(newSize)
        setPageSize(val)
        setCurrentPage(1)
    }

    // ACTIONS HANDLERS
    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        startTransition(async () => {
            const result = await deleteDoctor(deleteId)
            if (result.error) {
                toast.error("Error al eliminar", { description: result.error })
            } else {
                toast.success("Doctor eliminado correctamente")
            }
            setDeleteId(null)
        })
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        startTransition(async () => {
            const result = await toggleDoctorStatus(id, !currentStatus)
            if (result.error) {
                toast.error("Error al cambiar estado", { description: result.error })
            } else {
                toast.success(`Doctor ${!currentStatus ? 'activado' : 'desactivado'} correctamente`)
            }
        })
    }

    const handleResetPassword = (email: string) => {
        setResetPasswordEmail(email)
    }

    const confirmResetPassword = async () => {
        if (!resetPasswordEmail) return
        startTransition(async () => {
            const result = await resetDoctorPassword(resetPasswordEmail)
            if (result.error) {
                toast.error("Error al enviar correo", { description: result.error })
            } else {
                toast.success("Correo de restablecimiento enviado", { description: `Se ha enviado un email a ${resetPasswordEmail}` })
            }
            setResetPasswordEmail(null)
        })
    }

    if (!doctors || doctors.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <Stethoscope className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">No hay médicos registrados aún.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col relative h-full">
            {/* Table Header / Toolbar */}
            <div className="p-4 bg-slate-50/30 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 rounded-t-3xl">
                <div className="flex flex-1 items-center gap-2 w-full max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar profesional por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 border-slate-200 bg-white rounded-xl text-sm"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-slate-200 text-slate-600 h-10 px-4 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-all">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                                {statusFilter !== "all" && (
                                    <span className="ml-2 h-2 w-2 rounded-full bg-blue-600"></span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-xl border border-slate-200">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-3 py-2">Estado de Cuenta</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "all"}
                                onSelect={() => setStatusFilter("all")}
                                className="cursor-pointer gap-2"
                            >
                                Todos
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "active"}
                                onSelect={() => setStatusFilter("active")}
                                className="cursor-pointer gap-2"
                            >
                                Activos
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "inactive"}
                                onSelect={() => setStatusFilter("inactive")}
                                className="cursor-pointer gap-2"
                            >
                                Inactivos
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm h-10"
                        >
                            <Columns className="h-4 w-4" />
                            Columnas
                        </button>

                        {showColumnSelector && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowColumnSelector(false)} />
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-[1.5rem] shadow-2xl border border-slate-200 z-50 py-3 animate-in fade-in zoom-in-95 duration-100">
                                    <p className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-50 mb-2">Visibilidad de Columnas</p>
                                    <div className="px-2 space-y-0.5">
                                        {ALL_COLUMNS.map(col => (
                                            <button
                                                key={col.id}
                                                onClick={() => toggleColumn(col.id)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-bold rounded-xl transition-all ${visibleColumns.includes(col.id)
                                                    ? 'text-blue-700 bg-blue-50/50'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span>{col.label}</span>
                                                {visibleColumns.includes(col.id) && <Check className="h-4 w-4 text-blue-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {toolbarAction && (
                        <>
                            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block" />
                            {toolbarAction}
                        </>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-b-3xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                            {visibleColumns.includes('nombre') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('nombre')}>
                                    <div className="flex items-center">
                                        Profesional
                                        <SortIcon field="nombre" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('especialidad') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('especialidad')}>
                                    <div className="flex items-center">
                                        Especialidad / Colegiado
                                        <SortIcon field="especialidad" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('email') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('email')}>
                                    <div className="flex items-center">
                                        Email
                                        <SortIcon field="email" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('cif') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('cif')}>
                                    <div className="flex items-center">
                                        CIF/NIF
                                        <SortIcon field="cif" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('telefono') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('telefono')}>
                                    <div className="flex items-center">
                                        Teléfono
                                        <SortIcon field="telefono" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('direccion') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('direccion')}>
                                    <div className="flex items-center">
                                        Dirección
                                        <SortIcon field="direccion" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('bio') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('bio')}>
                                    <div className="flex items-center">
                                        Biografía
                                        <SortIcon field="bio" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('created_at') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('created_at')}>
                                    <div className="flex items-center">
                                        Fecha de Alta
                                        <SortIcon field="created_at" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('estado') && (
                                <th className="px-8 py-5 text-right font-bold">Estado</th>
                            )}
                            {visibleColumns.includes('acciones') && (
                                <th className="px-8 py-5 text-right font-bold">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedDoctors.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Search className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">No se han encontrado profesionales</h3>
                                        <p className="text-slate-500 max-w-xs mx-auto">Pruebe a cambiar los términos de búsqueda o los filtros activos.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedDoctors.map((doc) => (
                                <tr key={doc.id} className={`hover:bg-slate-50/50 transition-colors group ${doc.is_active === false ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}`}>
                                    {visibleColumns.includes('nombre') && (
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors ${doc.is_active === false ? 'bg-slate-100' : 'bg-blue-50 group-hover:bg-blue-600'}`}>
                                                    <Stethoscope className={`h-5 w-5 transition-colors ${doc.is_active === false ? 'text-slate-400' : 'text-blue-600 group-hover:text-white'}`} />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block">{doc.nombre} {doc.apellidos}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">ID: {doc.id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('especialidad') && (
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{doc.especialidad || 'No definida'}</span>
                                                <span className="text-xs text-slate-400 font-medium">Col: {doc.numero_colegiado || '---'}</span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('email') && (
                                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{doc.email}</td>
                                    )}
                                    {visibleColumns.includes('cif') && (
                                        <td className="px-8 py-5 text-sm text-slate-600 font-medium">{doc.cif || '---'}</td>
                                    )}
                                    {visibleColumns.includes('telefono') && (
                                        <td className="px-8 py-5 text-sm text-slate-600">{doc.telefono || '---'}</td>
                                    )}
                                    {visibleColumns.includes('direccion') && (
                                        <td className="px-8 py-5 text-sm text-slate-600 truncate max-w-[200px]" title={doc.direccion}>{doc.direccion || '---'}</td>
                                    )}
                                    {visibleColumns.includes('bio') && (
                                        <td className="px-8 py-5 text-sm text-slate-500 truncate max-w-[200px]" title={doc.bio}>{doc.bio || '---'}</td>
                                    )}
                                    {visibleColumns.includes('created_at') && (
                                        <td className="px-8 py-5 text-sm text-slate-500">
                                            {new Date(doc.created_at).toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                        </td>
                                    )}
                                    {visibleColumns.includes('estado') && (
                                        <td className="px-8 py-5 text-right">
                                            {doc.is_active !== false ? (
                                                <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                    ACTIVO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
                                                    <Ban className="h-3 w-3 mr-1" />
                                                    INACTIVO
                                                </span>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.includes('acciones') && (
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border border-slate-200">
                                                        <DropdownMenuItem onSelect={() => setEditingDoctor(doc)} className="cursor-pointer gap-2 p-2.5">
                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                            Editar Perfil
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem onSelect={() => handleResetPassword(doc.email)} className="cursor-pointer gap-2 p-2.5">
                                                            <Lock className="h-4 w-4 text-amber-500" />
                                                            Reset Password
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            onSelect={() => handleToggleStatus(doc.id, doc.is_active !== false)}
                                                            className="cursor-pointer gap-2 p-2.5"
                                                        >
                                                            {doc.is_active !== false ? (
                                                                <>
                                                                    <Ban className="h-4 w-4 text-orange-500" />
                                                                    Desactivar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    Reactivar
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onSelect={() => handleDelete(doc.id)}
                                                            className="cursor-pointer gap-2 p-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500 font-medium">Mostrar</span>
                    <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="all">Todas</option>
                    </select>
                    <span className="text-slate-500 font-medium">por página</span>
                </div>

                {pageSize !== "all" && (
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1 mx-2">
                            <span className="text-sm font-bold text-slate-900">{currentPage}</span>
                            <span className="text-sm font-medium text-slate-400">de</span>
                            <span className="text-sm font-bold text-slate-900">{totalPages}</span>
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="text-xs text-slate-400 font-medium italic">
                    Mostrando {paginatedDoctors.length} de {doctors.length} resultados
                </div>
            </div>

            {/* Alert Dialogs */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-white rounded-3xl border border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el perfil del médico y no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-slate-200 hover:bg-slate-50">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                            {isPending ? "Eliminando..." : "Eliminar Médico"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!resetPasswordEmail} onOpenChange={(open) => !open && setResetPasswordEmail(null)}>
                <AlertDialogContent className="bg-white rounded-3xl border border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Quieres enviar un correo de restablecimiento de contraseña a <strong>{resetPasswordEmail}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-slate-200 hover:bg-slate-50">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmResetPassword}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        >
                            {isPending ? "Enviando..." : "Enviar Correo"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Modal */}
            <EditDoctorModal
                key={editingDoctor?.id}
                doctor={editingDoctor}
                open={!!editingDoctor}
                onOpenChange={(open) => !open && setEditingDoctor(null)}
            />
        </div>
    )
}
