"use client"

import { useState, useMemo, useEffect } from "react"
import { Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Columns, Check, Search, Filter, User, Calendar, MapPin, Smartphone, FileText, MoreVertical, Eye, Pencil, Trash2, Droplets, PlusCircle, Mail, RotateCcw, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { resendPatientInvitation, resetPatientPassword } from "@/app/dashboard/actions/patients"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { EditPatientModal } from "@/components/dashboard/pacientes/edit-patient-modal"

interface Patient {
    id: string
    nombre: string
    apellido1: string
    apellido2: string
    full_name: string
    email: string
    cip: string
    dni: string
    birth_date: string | null
    phone: string | null
    phone_prefix?: string | null
    phone_2?: string | null
    phone_prefix_2?: string | null
    address: string | null
    street_type?: string | null
    street?: string | null
    street_number?: string | null
    block?: string | null
    floor?: string | null
    door?: string | null
    city?: string | null
    province?: string | null
    zip_code?: string | null
    blood_group?: string | null
    cartera_id: string
    is_active: boolean
    created_at: string
    cartera?: {
        nombre: string
    }
}

interface PatientsTableProps {
    patients: Patient[]
    carteras?: { id: string, nombre: string }[]
    showCarteraColumn?: boolean
    toolbarAction?: React.ReactNode
}

const ALL_COLUMNS = [
    { id: 'cip', label: 'CIP' },
    { id: 'full_name', label: 'Paciente' },
    { id: 'dni', label: 'DNI / Identificación' },
    { id: 'estado', label: 'Estado Acceso' },
    { id: 'blood_group', label: 'Grupo Sanguíneo' },
    { id: 'phone', label: 'Teléfono Principal' },
    { id: 'province', label: 'Provincia' },
    { id: 'city', label: 'Ciudad' },
    { id: 'address_full', label: 'Dirección Postal' },
    { id: 'cartera', label: 'Cartera' },
    { id: 'created_at', label: 'Alta' },
    { id: 'acciones', label: 'Acciones' }
]

export function PatientsTable({ patients, carteras = [], showCarteraColumn = true, toolbarAction }: PatientsTableProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])
    const [pageSize, setPageSize] = useState<number | "all">(10)
    const [sortField, setSortField] = useState<keyof Patient>("created_at")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [showColumnSelector, setShowColumnSelector] = useState(false)

    const defaultVisible = ['cip', 'full_name', 'estado', 'phone', 'created_at', 'acciones']
    if (showCarteraColumn) defaultVisible.push('cartera')

    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisible)
    const [searchTerm, setSearchTerm] = useState("")
    const [bloodFilter, setBloodFilter] = useState<string>("all")

    // Persistence logic
    useEffect(() => {
        const saved = localStorage.getItem('table_columns_patients_v2')
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
        localStorage.setItem('table_columns_patients_v2', JSON.stringify(newVisible))
    }

    const filteredAndSortedPatients = useMemo(() => {
        // 1. Filter
        let result = patients.filter(p => {
            const search = searchTerm.toLowerCase()
            const matchesSearch = (p.full_name || "").toLowerCase().includes(search) ||
                (p.cip || "").toLowerCase().includes(search) ||
                (p.dni || "").toLowerCase().includes(search) ||
                (p.phone || "").toLowerCase().includes(search) ||
                (p.city || "").toLowerCase().includes(search) ||
                (p.province || "").toLowerCase().includes(search) ||
                (p.cartera?.nombre || "").toLowerCase().includes(search)

            const matchesBlood = bloodFilter === "all" || p.blood_group === bloodFilter

            return matchesSearch && matchesBlood
        })

        // 2. Sort
        return result.sort((a, b) => {
            let aValue: any = a[sortField] || ""
            let bValue: any = b[sortField] || ""

            if (sortField === 'full_name') {
                aValue = a.full_name.toLowerCase()
                bValue = b.full_name.toLowerCase()
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = bValue.toLowerCase()
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
            return 0
        })
    }, [patients, searchTerm, bloodFilter, sortField, sortDirection])

    const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredAndSortedPatients.length / (pageSize as number))

    const paginatedPatients = useMemo(() => {
        if (pageSize === "all") return filteredAndSortedPatients
        const start = (currentPage - 1) * (pageSize as number)
        const end = start + (pageSize as number)
        return filteredAndSortedPatients.slice(start, end)
    }, [filteredAndSortedPatients, currentPage, pageSize])

    const toggleSort = (field: keyof Patient) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const SortIcon = ({ field }: { field: keyof Patient }) => {
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

    if (!mounted) return null;

    if (!patients || (patients.length === 0 && searchTerm === "")) {

        return (
            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center">
                <div className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 bg-gray-50 rounded flex items-center justify-center border border-gray-200">
                            <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-900 text-lg">No hay pacientes registrados</h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                Añada su primer paciente para comenzar
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
                            placeholder="Buscar por nombre, DNI, teléfono..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10 h-10 border-gray-300 bg-white text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={bloodFilter} onValueChange={(val) => {
                            setBloodFilter(val)
                            setCurrentPage(1)
                        }}>
                            <SelectTrigger className="h-10 w-[140px] border-gray-300 bg-white text-xs text-gray-600">
                                <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                <SelectValue placeholder="Sangre" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos G.S.</SelectItem>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
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
                                                onClick={() => {
                                                    if (col.id === 'cartera' && !showCarteraColumn) return;
                                                    toggleColumn(col.id);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${visibleColumns.includes(col.id)
                                                    ? 'text-blue-700 bg-blue-50'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                    } ${(col.id === 'cartera' && !showCarteraColumn) ? 'hidden' : ''}`}
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

                    <div className="h-8 w-[1px] bg-slate-200 hidden xl:block mx-1" />

                    {toolbarAction}
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wide border-b border-gray-200">
                            {visibleColumns.includes('cip') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('cip' as any)}>
                                    <div className="flex items-center">
                                        CIP / Registro
                                        <SortIcon field={'cip' as any} />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('full_name') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('full_name')}>
                                    <div className="flex items-center">
                                        Paciente
                                        <SortIcon field="full_name" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('dni') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('dni')}>
                                    <div className="flex items-center">
                                        DNI / ID
                                        <SortIcon field="dni" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('estado') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Estado</th>
                            )}
                            {visibleColumns.includes('blood_group') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Grupo Sang.</th>
                            )}
                            {visibleColumns.includes('phone') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Teléfono</th>
                            )}
                            {visibleColumns.includes('province') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Provincia</th>
                            )}
                            {visibleColumns.includes('city') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Ciudad</th>
                            )}
                            {visibleColumns.includes('address_full') && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Dirección</th>
                            )}
                            {visibleColumns.includes('cartera') && showCarteraColumn && (
                                <th className="px-6 py-3 whitespace-nowrap text-left">Cartera</th>
                            )}
                            {visibleColumns.includes('created_at') && (
                                <th className="px-6 py-3 cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap text-left" onClick={() => toggleSort('created_at')}>
                                    <div className="flex items-center">
                                        Alta
                                        <SortIcon field="created_at" />
                                    </div>
                                </th>
                            )}
                            {visibleColumns.includes('acciones') && (
                                <th className="px-6 py-3 text-right whitespace-nowrap">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedPatients.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-8 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">Sin coincidencias</h3>
                                            <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">No hay pacientes que coincidan con los filtros aplicados actualmente.</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setBloodFilter("all");
                                            }}
                                            className="text-blue-600 font-bold hover:bg-blue-50 rounded-xl"
                                        >
                                            Restablecer Filtros
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedPatients.map((p) => (
                                <tr
                                    key={p.id}
                                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/pacientes/${p.id}`)}
                                >
                                    {visibleColumns.includes('cip') && (
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                    {p.cip || 'PENDIENTE'}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('full_name') && (
                                        <td className="px-6 py-3">
                                            <div>
                                                <span className="font-semibold text-gray-900 text-sm block">{p.full_name}</span>
                                                <span className="text-xs text-gray-500 mt-0.5 block">
                                                    {p.dni}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('dni') && (
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-gray-600">
                                                {p.dni}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('estado') && (
                                        <td className="px-6 py-3">
                                            {p.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-1 bg-green-50/50 text-green-700 text-xs font-semibold rounded border border-green-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 bg-amber-50/50 text-amber-700 text-xs font-semibold rounded border border-amber-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />
                                                    Verificando
                                                </span>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.includes('blood_group') && (
                                        <td className="px-6 py-3">
                                            {p.blood_group ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50/50 text-red-700 rounded border border-red-200 text-xs font-semibold">
                                                    <Droplets className="h-3 w-3" />
                                                    {p.blood_group}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">---</span>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.includes('phone') && (
                                        <td className="px-6 py-3">
                                            <div className="text-sm text-gray-600">
                                                {p.phone ? (
                                                    <span>{p.phone_prefix} {p.phone}</span>
                                                ) : <span className="text-gray-400 italic">---</span>}
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.includes('province') && (
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-gray-600">
                                                {p.province || <span className="text-gray-400 italic">---</span>}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('city') && (
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-gray-600">
                                                {p.city || <span className="text-gray-400 italic">---</span>}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('address_full') && (
                                        <td className="px-6 py-3">
                                            <span className="text-xs text-gray-500 max-w-[200px] truncate block" title={p.street ? `${p.street_type || 'C/'} ${p.street}, ${p.street_number}` : ''}>
                                                {p.street ? (
                                                    `${p.street_type} ${p.street}, ${p.street_number}`
                                                ) : (
                                                    p.address || <span className="italic text-gray-400">---</span>
                                                )}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('cartera') && showCarteraColumn && (
                                        <td className="px-6 py-3">
                                            <span className="text-sm text-blue-600">
                                                {p.cartera?.nombre || '---'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('created_at') && (
                                        <td className="px-6 py-3">
                                            <span className="text-xs text-gray-500">
                                                {new Date(p.created_at).toLocaleDateString("es-ES", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.includes('acciones') && (
                                        <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end items-center gap-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                                                            <MoreVertical className="h-5 w-5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border border-slate-200 p-2">
                                                        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-50 mb-1">Opciones de Ficha</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(`/dashboard/pacientes/${p.id}`)}
                                                            className="rounded-xl flex items-center gap-3 p-3 text-slate-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer font-bold text-xs"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Visualizar Perfil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setPatientToEdit(p)
                                                            }}
                                                            className="rounded-xl flex items-center gap-3 p-3 text-slate-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer font-bold text-xs"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Editar Información
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-50 mx-2 my-1" />
                                                        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Seguridad y Acceso</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={async () => {
                                                                const res = await resendPatientInvitation(p.id, p.email)
                                                                if (res.success) toast.success("Invitación reenviada")
                                                                else toast.error(res.error)
                                                            }}
                                                            className="rounded-xl flex items-center gap-3 p-3 text-slate-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer font-bold text-xs"
                                                            disabled={p.is_active}
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            Reenviar Invitación
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={async () => {
                                                                const res = await resetPatientPassword(p.email)
                                                                if (res.success) toast.success("Correo de recuperación enviado")
                                                                else toast.error(res.error)
                                                            }}
                                                            className="rounded-xl flex items-center gap-3 p-3 text-slate-700 focus:bg-blue-50 focus:text-blue-700 cursor-pointer font-bold text-xs"
                                                            disabled={!p.is_active}
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                            Restablecer Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-50 mx-2 my-1" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl flex items-center gap-3 p-3 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer font-bold text-xs"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Archivar Paciente
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
            <div className="px-8 py-5 bg-slate-50/20 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-b-3xl mt-auto">
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Mostrar</span>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm transition-all"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="all">Todas</option>
                        </select>
                    </div>
                </div>

                {pageSize !== "all" && filteredAndSortedPatients.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all text-slate-500 shadow-sm active:scale-95"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all text-slate-500 shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-5 py-2 group shadow-sm">
                            <span className="text-sm font-black text-blue-600 transition-colors">{currentPage}</span>
                            <div className="h-3 w-[1px] bg-slate-200 mx-3 opacity-50" />
                            <span className="text-sm font-bold text-slate-400">{totalPages}</span>
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all text-slate-500 shadow-sm active:scale-95"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-20 transition-all text-slate-500 shadow-sm active:scale-95"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {filteredAndSortedPatients.length} / {patients.length} Pacientes
                    </span>
                </div>
            </div>

            <EditPatientModal
                patient={patientToEdit}
                carteras={carteras}
                onOpenChange={(open) => !open && setPatientToEdit(null)}
                trigger={<></>} // Controlled mode
            />
        </div >
    )
}
