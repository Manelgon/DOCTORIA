"use client"

import { useState, useMemo, useEffect } from "react"
import {
    Calendar,
    ChevronRight,
    Search,
    Stethoscope,
    FileText,
    Activity,
    ChevronsLeft,
    ChevronLeft,
    ChevronsRight,
    User,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Columns,
    Check,
    MoreVertical,
    Eye,
    ClipboardList
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ConsultationDetailModal } from "@/components/dashboard/consultas/consultation-detail-modal"
import { cn } from "@/lib/utils"

interface VitalSign {
    type: 'temperatura' | 'presion' | 'frecuencia_cardiaca' | 'sato2' | 'peso' | 'altura' | 'glucosa'
    value: string
    unit?: string
}

interface Consultation {
    id: string
    fecha: string
    diagnosis: string | null
    treatment: string | null
    notes: string | null
    aproximacion_diagnostica: string | null
    signos_vitales: VitalSign[]
    medico?: {
        nombre: string
        apellidos: string
        especialidad?: string
    }
    paciente?: {
        id: string
        full_name: string
        cip?: string
    }
    diagnosticos?: Array<{
        rank: number
        status: string
        catalogo: {
            display: string
            code: string
            system: string
        }
    }>
}

interface ConsultationsTableProps {
    consultations: Consultation[]
    itemsPerPage?: number
    showPatientColumn?: boolean
}

const ALL_COLUMNS = [
    { id: 'cip', label: 'CIP' },
    { id: 'fecha', label: 'Fecha / Hora' },
    { id: 'paciente', label: 'Paciente' },
    { id: 'motivo', label: 'Motivo Consulta' },
    { id: 'aproximacion', label: 'Aprox. Diagnóstica' },
    { id: 'diagnostico_final', label: 'Diagnóstico' },
    { id: 'facultativo', label: 'Facultativo' },
    { id: 'acciones', label: 'Acciones' }
]

export function ConsultationsTable({ consultations, itemsPerPage = 10, showPatientColumn = false }: ConsultationsTableProps) {
    const [mounted, setMounted] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState<number | "all">(itemsPerPage)
    const [sortField, setSortField] = useState<keyof Consultation>("fecha")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [showColumnSelector, setShowColumnSelector] = useState(false)
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)

    const defaultVisible = ['fecha', 'motivo', 'aproximacion', 'diagnostico_final', 'facultativo', 'acciones']
    if (showPatientColumn) {
        defaultVisible.unshift('cip', 'paciente')
    }
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisible)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('table_columns_consultations_v1')
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
        localStorage.setItem('table_columns_consultations_v1', JSON.stringify(newVisible))
    }

    const filteredAndSortedData = useMemo(() => {
        // 1. Filter
        let result = consultations.filter(c => {
            const search = searchTerm.toLowerCase()
            return (
                (c.diagnosis || "").toLowerCase().includes(search) ||
                (c.aproximacion_diagnostica || "").toLowerCase().includes(search) ||
                (c.notes || "").toLowerCase().includes(search) ||
                (c.medico?.nombre || "").toLowerCase().includes(search) ||
                (c.medico?.apellidos || "").toLowerCase().includes(search) ||
                (c.paciente?.full_name || "").toLowerCase().includes(search) ||
                (c.paciente?.cip || "").toLowerCase().includes(search) ||
                (c.diagnosticos || []).some(d =>
                    (d.catalogo.display || "").toLowerCase().includes(search) ||
                    (d.catalogo.code || "").toLowerCase().includes(search)
                )
            )
        })

        // 2. Sort
        return result.sort((a, b) => {
            let aValue: any = a[sortField] || ""
            let bValue: any = b[sortField] || ""

            if (sortField === 'fecha') {
                aValue = new Date(a.fecha).getTime()
                bValue = new Date(b.fecha).getTime()
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = bValue.toLowerCase()
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
            return 0
        })
    }, [consultations, searchTerm, sortField, sortDirection])

    const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredAndSortedData.length / (pageSize as number))

    const paginatedData = useMemo(() => {
        if (pageSize === "all") return filteredAndSortedData
        const start = (currentPage - 1) * (pageSize as number)
        const end = start + (pageSize as number)
        return filteredAndSortedData.slice(start, end)
    }, [filteredAndSortedData, currentPage, pageSize])

    const toggleSort = (field: keyof Consultation) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const SortIcon = ({ field }: { field: keyof Consultation }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
        return sortDirection === "asc"
            ? <ArrowUp className="ml-2 h-3.5 w-3.5 text-blue-600" />
            : <ArrowDown className="ml-2 h-3.5 w-3.5 text-blue-600" />
    }

    if (!mounted) return null

    return (
        <div className="bg-white rounded-md border border-gray-200 shadow-sm flex flex-col relative">
            {/* Admin Toolbar */}
            <div className="p-4 bg-white border-b border-gray-200 flex flex-col xl:flex-row items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2 w-full">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar en historial (diagnóstico, médico...)"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10 h-10 border-gray-300 bg-white text-sm"
                        />
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
                                            <div key={col.id} className={cn(
                                                (col.id === 'paciente' || col.id === 'cip') && !showPatientColumn && "hidden"
                                            )}>
                                                <button
                                                    onClick={() => toggleColumn(col.id)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                                                        visibleColumns.includes(col.id)
                                                            ? 'text-blue-700 bg-blue-50'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    )}
                                                >
                                                    <span>{col.label}</span>
                                                    {visibleColumns.includes(col.id) && <Check className="h-4 w-4 text-blue-600" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wide border-b border-gray-200">
                            {visibleColumns.includes('cip') && showPatientColumn && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('paciente' as any)}>
                                    <div className="flex items-center">
                                        CIP
                                        <SortIcon field={'paciente' as any} />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('fecha') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('fecha')}>
                                    <div className="flex items-center">
                                        Fecha / Hora
                                        <SortIcon field="fecha" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('paciente') && showPatientColumn && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('paciente' as any)}>
                                    <div className="flex items-center">
                                        Paciente
                                        <SortIcon field={'paciente' as any} />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('motivo') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('diagnosis')}>
                                    <div className="flex items-center">
                                        Motivo Consulta
                                        <SortIcon field="diagnosis" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('aproximacion') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('aproximacion_diagnostica' as any)}>
                                    <div className="flex items-center">
                                        Aproximación
                                        <SortIcon field={'aproximacion_diagnostica' as any} />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('diagnostico_final') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Diagnóstico</th>
                            )}
                            {visibleColumns.includes('facultativo') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Facultativo</th>
                            )}
                            {visibleColumns.includes('acciones') && (
                                <th className="px-6 py-3 text-right whitespace-nowrap">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-8 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">Sin coincidencias</h3>
                                            <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">No hay consultas que coincidan con los filtros aplicados.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((c) => (
                                <tr
                                    key={c.id}
                                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedConsultation(c)}
                                >
                                    {visibleColumns.includes('cip') && showPatientColumn && (
                                        <td className="px-6 py-3">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {c.paciente?.cip || 'SIN CIP'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('fecha') && (
                                        <td className="px-6 py-3">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {new Date(c.fecha).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(c.fecha).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('paciente') && showPatientColumn && (
                                        <td className="px-6 py-3">
                                            <span className="font-semibold text-gray-900 text-sm">
                                                {c.paciente?.full_name || '---'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('motivo') && (
                                        <td className="px-6 py-3 min-w-[200px]">
                                            <span className="text-sm text-gray-700 block truncate max-w-[200px]">
                                                {c.diagnosis || '---'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('aproximacion') && (
                                        <td className="px-6 py-3 min-w-[200px]">
                                            <span className="text-sm text-gray-700 block truncate max-w-[200px]">
                                                {c.aproximacion_diagnostica || '---'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('diagnostico_final') && (
                                        <td className="px-8 py-6">
                                            {c.diagnosticos && c.diagnosticos.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {c.diagnosticos
                                                        .sort((a, b) => a.rank - b.rank)
                                                        .slice(0, 1)
                                                        .map((d, idx) => (
                                                            <div key={idx} className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-800 line-clamp-1">
                                                                    {d.catalogo.display}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                                        {d.catalogo.system}: {d.catalogo.code}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter",
                                                                        d.status === 'confirmado' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                                            d.status === 'descartado' ? "bg-red-50 text-red-600 border border-red-100" :
                                                                                "bg-amber-50 text-amber-600 border border-amber-100"
                                                                    )}>
                                                                        {d.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {c.diagnosticos.length > 1 && (
                                                        <span className="text-[9px] font-bold text-blue-500 italic mt-0.5">
                                                            + {c.diagnosticos.length - 1} más
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 italic">No codificado</span>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.includes('facultativo') && (
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-gray-600">
                                                Dr. {c.medico?.apellidos || '---'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('acciones') && (
                                        <td className="px-6 py-3 text-right">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                                                <Eye className="h-5 w-5" />
                                            </button>
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
                <div className="text-xs text-gray-500 font-medium">
                    RESULTADOS: {filteredAndSortedData.length}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(1); }}
                            className="p-2 hover:bg-white border border-gray-300 disabled:opacity-30 transition-colors text-gray-600"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev - 1); }}
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
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev + 1); }}
                            className="p-2 hover:bg-white border border-gray-300 disabled:opacity-30 transition-colors text-gray-600"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(totalPages); }}
                            className="p-2 hover:bg-white border border-gray-300 disabled:opacity-30 transition-colors text-gray-600"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <ConsultationDetailModal
                consultation={selectedConsultation}
                isOpen={!!selectedConsultation}
                onClose={() => setSelectedConsultation(null)}
            />
        </div>
    )
}
