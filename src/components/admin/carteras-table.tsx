"use client"

import { useState, useMemo, useEffect } from "react"
import { Briefcase, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Columns, Check, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Cartera {
    id: string
    nombre: string
    descripcion?: string
    owner: {
        full_name: string
        email: string
    }
}

interface CarterasTableProps {
    carteras: Cartera[]
    toolbarAction?: React.ReactNode
}

const ALL_COLUMNS = [
    { id: 'nombre', label: 'Cartera' },
    { id: 'owner', label: 'Titular (Médico)' },
    { id: 'email', label: 'Emails Asociados' },
    { id: 'estado', label: 'Estado' }
]

export function CarterasTable({ carteras, toolbarAction }: CarterasTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState<number | "all">(10)
    const [sortField, setSortField] = useState<string>("nombre")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [showColumnSelector, setShowColumnSelector] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['nombre', 'owner', 'email', 'estado'])

    // Search State
    const [searchTerm, setSearchTerm] = useState("")

    // Persistence logic
    useEffect(() => {
        const saved = localStorage.getItem('table_columns_carteras')
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
        localStorage.setItem('table_columns_carteras', JSON.stringify(newVisible))
    }

    const filteredAndSortedCarteras = useMemo(() => {
        // 1. Filter
        let result = carteras.filter(cartera => {
            const matchesSearch = cartera.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (cartera.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (cartera.owner?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (cartera.owner?.email || "").toLowerCase().includes(searchTerm.toLowerCase())

            return matchesSearch
        })

        // 2. Sort
        return result.sort((a, b) => {
            let aValue: any = ""
            let bValue: any = ""

            if (sortField === 'owner') {
                aValue = (a.owner?.full_name || "").toLowerCase()
                bValue = (b.owner?.full_name || "").toLowerCase()
            } else if (sortField === 'email') {
                aValue = (a.owner?.email || "").toLowerCase()
                bValue = (b.owner?.email || "").toLowerCase()
            } else {
                aValue = (a[sortField as keyof Cartera] as string || "").toLowerCase()
                bValue = (b[sortField as keyof Cartera] as string || "").toLowerCase()
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
            return 0
        })
    }, [carteras, searchTerm, sortField, sortDirection])

    const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredAndSortedCarteras.length / (pageSize as number))

    const paginatedCarteras = useMemo(() => {
        if (pageSize === "all") return filteredAndSortedCarteras
        const start = (currentPage - 1) * (pageSize as number)
        const end = start + (pageSize as number)
        return filteredAndSortedCarteras.slice(start, end)
    }, [filteredAndSortedCarteras, currentPage, pageSize])

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const SortIcon = ({ field }: { field: string }) => {
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

    if (!carteras || carteras.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <Briefcase className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">No se encontraron carteras registradas.</p>
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
                            placeholder="Buscar cartera por nombre o titular..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 border-slate-200 bg-white rounded-xl text-sm"
                        />
                    </div>
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

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                            {visibleColumns.includes('nombre') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('nombre')}>
                                    <div className="flex items-center">
                                        Cartera
                                        <SortIcon field="nombre" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('owner') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('owner')}>
                                    <div className="flex items-center">
                                        Titular (Médico)
                                        <SortIcon field="owner" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('email') && (
                                <th className="px-8 py-5 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('email')}>
                                    <div className="flex items-center">
                                        Emails Asociados
                                        <SortIcon field="email" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('estado') && (
                                <th className="px-8 py-5 text-right font-bold">Estado</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedCarteras.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Search className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">No se han encontrado carteras</h3>
                                        <p className="text-slate-500 max-w-xs mx-auto">Pruebe a cambiar los términos de búsqueda o los filtros activos.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedCarteras.map((cartera) => (
                                <tr key={cartera.id} className="hover:bg-slate-50/50 transition-colors group">
                                    {visibleColumns.includes('nombre') && (
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                                    <Briefcase className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{cartera.nombre}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase truncate max-w-[200px]">{cartera.descripcion || 'Sin descripción'}</p>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('owner') && (
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                <p className="text-sm font-medium text-slate-700">
                                                    {cartera.owner?.full_name || 'Desconocido'}
                                                </p>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('email') && (
                                        <td className="px-8 py-5 text-sm font-medium text-slate-600">
                                            {cartera.owner?.email}
                                        </td>
                                    )}
                                    {visibleColumns.includes('estado') && (
                                        <td className="px-8 py-5 text-right">
                                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-100">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                ACTIVA
                                            </span>
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

                {pageSize !== "all" && filteredAndSortedCarteras.length > 0 && (
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
                    Mostrando {paginatedCarteras.length} de {filteredAndSortedCarteras.length} resultados (de {carteras.length} totales)
                </div>
            </div>
        </div>
    )
}
