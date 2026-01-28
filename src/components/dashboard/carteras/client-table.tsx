"use client"

import { useState, useMemo, useEffect } from "react"
import {
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Share2,
    Columns,
    Check,
    X,
    Loader2,
    Mail,
    Pencil,
    Trash2,
    AlertTriangle,
    MoreVertical,
    Eye,
    Search,
    Filter,
    Plus,
    Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { sharePortfolio, updateCartera, deleteCartera } from "@/app/dashboard/actions/carteras"
import { CreatePortfolioModal } from "@/components/dashboard/carteras/create-portfolio-modal"
import { CreatePatientModal } from "@/components/dashboard/pacientes/create-patient-modal"
import { toast } from "sonner"

interface Cartera {
    id: string
    nombre: string
    descripcion?: string | null
    owner_id: string
    pacientes: { count: number }[]
    compartidos: { medico: { email: string } }[]
    created_at: string
}

interface ClientTableProps {
    carteras: Cartera[]
    userId: string
    toolbarAction?: React.ReactNode
}

const ALL_COLUMNS = [
    { id: 'nombre', label: 'Cartera' },
    { id: 'pacientes', label: 'Pacientes' },
    { id: 'owner', label: 'Propiedad' },
    { id: 'compartidos', label: 'Acceso' },
    { id: 'acciones', label: 'Acciones' }
]

export function ClientTable({ carteras, userId, toolbarAction }: ClientTableProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState<number | "all">(10)
    const [sortField, setSortField] = useState<string>("nombre")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [showColumnSelector, setShowColumnSelector] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['nombre', 'pacientes', 'owner', 'compartidos', 'acciones'])

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState("")
    const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "shared">("all")

    // Modals State
    const [sharingCartera, setSharingCartera] = useState<Cartera | null>(null)
    const [isSharing, setIsSharing] = useState(false)
    const [shareEmail, setShareEmail] = useState("")
    const [editingCartera, setEditingCartera] = useState<Cartera | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [deletingCarteraId, setDeletingCarteraId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Hydration and Persistence
    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('table_columns_doctor_carteras_v4')
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
        localStorage.setItem('table_columns_doctor_carteras_v4', JSON.stringify(newVisible))
    }

    const filteredAndSortedCarteras = useMemo(() => {
        let result = carteras.filter(cartera => {
            const matchesSearch = cartera.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (cartera.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase())
            const matchesOwner = ownerFilter === "all" ? true :
                ownerFilter === "mine" ? cartera.owner_id === userId :
                    cartera.owner_id !== userId
            return matchesSearch && matchesOwner
        })

        return result.sort((a, b) => {
            let aValue: any = ""
            let bValue: any = ""
            if (sortField === 'pacientes') {
                aValue = a.pacientes?.[0]?.count || 0
                bValue = b.pacientes?.[0]?.count || 0
            } else if (sortField === 'compartidos') {
                aValue = a.compartidos?.length || 0
                bValue = b.compartidos?.length || 0
            } else {
                aValue = (a[sortField as keyof Cartera] as string || "").toLowerCase()
                bValue = (b[sortField as keyof Cartera] as string || "").toLowerCase()
            }
            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
            return 0
        })
    }, [carteras, searchTerm, ownerFilter, sortField, sortDirection, userId])

    const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredAndSortedCarteras.length / (pageSize as number))
    const paginatedCarteras = useMemo(() => {
        if (pageSize === "all") return filteredAndSortedCarteras
        const start = (currentPage - 1) * (pageSize as number)
        return filteredAndSortedCarteras.slice(start, start + (pageSize as number))
    }, [filteredAndSortedCarteras, currentPage, pageSize])

    const toggleSort = (field: string) => {
        if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        else { setSortField(field); setSortDirection("asc"); }
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />
    }

    const handlePageSizeChange = (newSize: string) => {
        const val = newSize === "all" ? "all" : parseInt(newSize)
        setPageSize(val)
        setCurrentPage(1)
    }

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault(); if (!sharingCartera) return;
        setIsSharing(true)
        try {
            const result = await sharePortfolio(sharingCartera.id, shareEmail)
            if (result.error) toast.error("Error al compartir", { description: result.error })
            else {
                toast.success("Invitación enviada", { description: `Se ha enviado una invitación a ${shareEmail}` })
                setSharingCartera(null); setShareEmail("");
            }
        } catch (error) { toast.error("Error inesperado") } finally { setIsSharing(false) }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editingCartera) return;
        setIsUpdating(true)
        try {
            const result = await updateCartera(editingCartera.id, editName, editDescription)
            if (result.success) { toast.success("Cartera actualizada correctamente"); setEditingCartera(null); }
            else toast.error("Error al actualizar", { description: result.error })
        } catch (error) { toast.error("Error inesperado") } finally { setIsUpdating(false) }
    }

    const handleDelete = async (carteraId: string) => {
        setIsDeleting(true)
        try {
            const result = await deleteCartera(carteraId)
            if (result.success) { toast.success("Cartera eliminada correctamente"); setDeletingCarteraId(null); }
            else toast.error("No se puede eliminar", { description: result.error })
        } catch (error) { toast.error("Error inesperado") } finally { setIsDeleting(false) }
    }

    if (!mounted) return null;

    if (!carteras || (carteras.length === 0 && searchTerm === "")) {
        return (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px] flex items-center justify-center relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20" />
                <div className="px-8 py-20 text-center relative z-10">
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-200 relative">
                            <Briefcase className="h-10 w-10 text-slate-300" />
                            <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                                <Plus className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-black text-slate-900 text-2xl tracking-tight">No hay carteras registradas</h3>
                            <p className="text-slate-500 max-w-sm mx-auto font-medium">
                                Comience por crear su primera cartera de clientes para organizar su actividad profesional.
                            </p>
                        </div>
                        <div className="pt-2">
                            {toolbarAction}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-md border border-gray-200 shadow-sm flex flex-col relative h-full">
            {/* Admin Toolbar */}
            <div className="p-4 bg-white border-b border-gray-200 flex flex-col xl:flex-row items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2 w-full">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nombre o descripción..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10 h-10 border-gray-300 bg-white text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 min-w-[140px] border-gray-300 bg-white text-xs text-gray-600 gap-2 px-4 hover:bg-gray-50 transition-colors">
                                    <Filter className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                    <span>{ownerFilter === "all" ? "Todas" : ownerFilter === "mine" ? "Mis Carteras" : "Compartidas"}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 rounded shadow-lg border border-gray-200 p-2">
                                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Filtro de Propiedad</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => setOwnerFilter("all")} className="p-3 text-xs text-gray-600 focus:bg-blue-50 focus:text-blue-700 cursor-pointer mb-1">Todas las Carteras</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setOwnerFilter("mine")} className="p-3 text-xs text-gray-600 focus:bg-blue-50 focus:text-blue-700 cursor-pointer mb-1">Mis Carteras</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setOwnerFilter("shared")} className="p-3 text-xs text-gray-600 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Compartidas Conmigo</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full xl:w-auto shrink-0">
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            className="h-10 border border-gray-300 bg-white text-xs text-gray-600 gap-2 px-4 hover:bg-gray-50 transition-colors flex items-center"
                        >
                            <Columns className="h-4 w-4 text-gray-400" />
                            Columnas
                        </button>

                        {showColumnSelector && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowColumnSelector(false)} />
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded shadow-lg border border-gray-200 z-50 py-2">
                                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-1">Columnas</p>
                                    <div className="px-2 space-y-0.5">
                                        {ALL_COLUMNS.map(col => (
                                            <button
                                                key={col.id}
                                                onClick={() => toggleColumn(col.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${visibleColumns.includes(col.id)
                                                    ? 'text-blue-700 bg-blue-50'
                                                    : 'text-gray-700 hover:bg-gray-50'
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

                    <div className="h-8 w-[1px] bg-gray-200 hidden xl:block mx-1" />

                    {toolbarAction}
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wide border-b border-gray-200">
                            {visibleColumns.includes('nombre') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('nombre')}>
                                    <div className="flex items-center">
                                        Cartera
                                        <SortIcon field="nombre" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('pacientes') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('pacientes')}>
                                    <div className="flex items-center">
                                        Pacientes
                                        <SortIcon field="pacientes" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('owner') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('owner')}>
                                    <div className="flex items-center">
                                        Propiedad
                                        <SortIcon field="owner" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('compartidos') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('compartidos')}>
                                    <div className="flex items-center">
                                        Acceso
                                        <SortIcon field="compartidos" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('acciones') && (
                                <th className="px-6 py-3 text-right whitespace-nowrap">Opciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedCarteras.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-8 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">Sin coincidencias</h3>
                                            <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">No hay carteras que coincidan con los filtros aplicados actualmente.</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setOwnerFilter("all");
                                            }}
                                            className="text-blue-600 font-bold hover:bg-blue-50 rounded-xl"
                                        >
                                            Restablecer Filtros
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedCarteras.map((cartera) => (
                                <tr
                                    key={cartera.id}
                                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/carteras/${cartera.id}`)}
                                >
                                    {visibleColumns.includes('nombre') && (
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors border border-blue-200">
                                                    <Briefcase className="h-4 w-4 text-blue-600 group-hover:text-white transition-colors" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900 block group-hover:text-blue-600 transition-colors text-sm">{cartera.nombre}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5 block">
                                                        {cartera.descripcion || 'Sin descripción adicional'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('pacientes') && (
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-gray-600 bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                                                {cartera.pacientes?.[0]?.count || 0} Registrados
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('owner') && (
                                        <td className="px-6 py-3">
                                            {cartera.owner_id === userId ? (
                                                <div className="inline-flex items-center px-2.5 py-1 bg-blue-50/50 text-blue-700 text-xs font-semibold rounded border border-blue-200">
                                                    Mi Propiedad
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center px-2.5 py-1 bg-gray-50/50 text-gray-600 text-xs font-semibold rounded border border-gray-200">
                                                    Compartida
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.includes('compartidos') && (
                                        <td className="px-6 py-3">
                                            <div className="flex -space-x-2">
                                                {cartera.compartidos?.slice(0, 3).map((comp, i) => (
                                                    <div
                                                        key={i}
                                                        className="h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200"
                                                        title={comp.medico?.email}
                                                    >
                                                        {comp.medico?.email?.[0].toUpperCase()}
                                                    </div>
                                                ))}
                                                {cartera.compartidos && cartera.compartidos.length > 3 && (
                                                    <div className="h-8 w-8 rounded-full ring-2 ring-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                        +{cartera.compartidos.length - 3}
                                                    </div>
                                                )}
                                                {(!cartera.compartidos || cartera.compartidos.length === 0) && (
                                                    <span className="text-xs text-slate-300 italic font-medium">Privada</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('acciones') && (
                                        <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end items-center gap-1">
                                                <button
                                                    onClick={() => router.push(`/dashboard/carteras/${cartera.id}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Ver Pacientes"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 outline-none">
                                                            <MoreVertical className="h-5 w-5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded shadow-lg border border-gray-200 p-2">
                                                        <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-100 mb-1">Gestión de Cartera</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(`/dashboard/carteras/${cartera.id}`)}
                                                            className="flex items-center gap-3 p-3 text-gray-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer mb-1 text-xs"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Explorar Cartera
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => setSharingCartera(cartera)}
                                                            className="flex items-center gap-3 p-3 text-gray-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer mb-1 text-xs"
                                                        >
                                                            <Share2 className="h-4 w-4" />
                                                            Compartir Acceso
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-gray-100 mx-2 my-1" />
                                                        <DropdownMenuItem
                                                            onSelect={() => {
                                                                setEditingCartera(cartera)
                                                                setEditName(cartera.nombre)
                                                                setEditDescription(cartera.descripcion || "")
                                                            }}
                                                            className="flex items-center gap-3 p-3 text-gray-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs"
                                                            disabled={cartera.owner_id !== userId}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Editar Información
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => setDeletingCarteraId(cartera.id)}
                                                            className="flex items-center gap-3 p-3 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer text-xs"
                                                            disabled={cartera.owner_id !== userId}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Eliminar Cartera
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

            {/* Admin Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500 font-medium">Mostrar</span>
                    <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        className="bg-white border border-gray-300 px-3 py-1.5 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="all">Todas</option>
                    </select>
                </div>

                {pageSize !== "all" && filteredAndSortedCarteras.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="p-2 hover:bg-white border border-gray-300 disabled:opacity-30 transition-colors text-gray-600"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 hover:bg-white border border-gray-300 disabled:opacity-30 transition-colors text-gray-600"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center bg-white border border-gray-300 px-4 py-1.5">
                            <span className="text-sm font-semibold text-gray-900">{currentPage}</span>
                            <span className="mx-2 text-gray-400">/</span>
                            <span className="text-sm text-gray-500">{totalPages}</span>
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 hover:bg-white border border-gray-300 disabled:opacity-30 transition-colors text-gray-600"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-2 hover:bg-white border border-gray-300 disabled:opacity-30 transition-colors text-gray-600"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="px-3 py-1.5 bg-white border border-gray-300">
                    <span className="text-xs font-medium text-gray-600">
                        {filteredAndSortedCarteras.length} / {carteras.length} Carteras
                    </span>
                </div>
            </div>

            {/* Modals Support Logic */}
            {sharingCartera && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-md relative animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-black text-2xl text-slate-900 flex items-center gap-3"><Share2 className="h-8 w-8 text-blue-600 p-1.5 bg-blue-50 rounded-xl" /> Compartir</h2>
                            <button onClick={() => setSharingCartera(null)} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X className="h-6 w-6" /></button>
                        </div>
                        <form onSubmit={handleShare} className="p-10 space-y-8">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center"><Briefcase className="h-6 w-6 text-blue-600" /></div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portafolio</p><p className="font-bold text-slate-900">{sharingCartera.nombre}</p></div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">E-mail del colaborador</Label>
                                <Input type="email" placeholder="medico@doctoria.es" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} required className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-lg" />
                            </div>
                            <Button type="submit" disabled={isSharing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-16 rounded-[1.5rem] shadow-xl shadow-blue-200 transition-all active:scale-[0.98] text-lg gap-3">
                                {isSharing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Share2 className="h-6 w-6" />} Otorgar Acceso Principal
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {editingCartera && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-md relative animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-black text-2xl text-slate-900 flex items-center gap-3"><Pencil className="h-8 w-8 text-amber-600 p-1.5 bg-amber-50 rounded-xl" /> Editar Detalles</h2>
                            <button onClick={() => setEditingCartera(null)} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X className="h-6 w-6" /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Técnico</Label>
                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black text-lg focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Observaciones</Label>
                                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-400" />
                                </div>
                            </div>
                            <Button type="submit" disabled={isUpdating} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-16 rounded-[1.5rem] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] text-lg">
                                {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Actualizar Información"}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {deletingCarteraId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-sm relative animate-in zoom-in-95 duration-300">
                        <div className="p-12 flex flex-col items-center text-center space-y-8">
                            <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-lg shadow-red-100"><AlertTriangle className="h-10 w-10 text-red-500 animate-bounce" /></div>
                            <div className="space-y-3">
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight">¿Confirmar Baja?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">Esta acción es irreversible y requiere que la cartera no tenga registros activos vinculados.</p>
                            </div>
                            <div className="flex flex-col w-full gap-4">
                                <Button onClick={() => handleDelete(deletingCarteraId)} disabled={isDeleting} className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-16 rounded-[1.5rem] shadow-xl shadow-red-200 flex items-center justify-center gap-3 transition-all active:scale-[0.95] text-lg">
                                    {isDeleting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Trash2 className="h-6 w-6" />} Eliminar Definitivamente
                                </Button>
                                <Button variant="ghost" onClick={() => setDeletingCarteraId(null)} className="h-12 font-black text-slate-400 hover:text-slate-600 hover:bg-transparent">No, mantener cartera</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
