"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, X, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchDiagnostics } from "@/app/dashboard/actions/diagnostics"
import { cn } from "@/lib/utils"

export interface SelectedDiagnostic {
    id: string
    display: string
    code: string | null
    system: string
    rank: number
    status: 'provisional' | 'confirmado' | 'descartado'
}

interface DiagnosticSelectorProps {
    onSelectionChange: (diagnostics: SelectedDiagnostic[]) => void
}

export function DiagnosticSelector({ onSelectionChange }: DiagnosticSelectorProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [selected, setSelected] = useState<SelectedDiagnostic[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setIsSearching(true)
                const data = await searchDiagnostics(query)
                setResults(data)
                setIsSearching(false)
                setShowResults(true)
            } else {
                setResults([])
                setShowResults(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [query])

    const handleSelect = (diag: any) => {
        if (selected.find(s => s.id === diag.id)) {
            setQuery("")
            setShowResults(false)
            return
        }

        const newSelection: SelectedDiagnostic[] = [
            ...selected,
            {
                id: diag.id,
                display: diag.display,
                code: diag.code,
                system: diag.system,
                rank: selected.length === 0 ? 1 : 2, // First one is primary by default
                status: 'provisional'
            }
        ]
        setSelected(newSelection)
        onSelectionChange(newSelection)
        setQuery("")
        setShowResults(false)
    }

    const removeDiagnostic = (id: string) => {
        const newSelection = selected.filter(s => s.id !== id)
        // Ensure at least one primary if selection is not empty
        if (newSelection.length > 0 && !newSelection.find(s => s.rank === 1)) {
            newSelection[0].rank = 1
        }
        setSelected(newSelection)
        onSelectionChange(newSelection)
    }

    const toggleRank = (id: string) => {
        const newSelection = selected.map(s => ({
            ...s,
            rank: s.id === id ? 1 : 2
        }))
        setSelected(newSelection)
        onSelectionChange(newSelection)
    }

    const updateStatus = (id: string, status: SelectedDiagnostic['status']) => {
        const newSelection = selected.map(s =>
            s.id === id ? { ...s, status } : s
        )
        setSelected(newSelection)
        onSelectionChange(newSelection)
    }

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                    placeholder="Buscar diagnóstico por nombre o código (CIE-10)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    className="pl-9 h-9 rounded border-slate-300 text-sm"
                />

                {showResults && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded border border-slate-300 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                        {isSearching ? (
                            <div className="p-3 text-center text-[10px] text-slate-400">Buscando...</div>
                        ) : results.length === 0 ? (
                            <div className="p-3 text-center text-[10px] text-slate-400">No se encontraron resultados</div>
                        ) : (
                            results.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => handleSelect(r)}
                                    className="w-full text-left p-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">{r.display}</p>
                                        <p className="text-[9px] font-medium text-slate-400 uppercase">
                                            {r.system}: {r.code || 'S/C'}
                                        </p>
                                    </div>
                                    <Plus className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600" />
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Selected Diagnostics List */}
            <div className="space-y-2 min-h-[40px]">
                {selected.length === 0 && (
                    <p className="text-[10px] text-slate-400 px-1">Ningún diagnóstico seleccionado</p>
                )}
                {selected.map((diag) => (
                    <div
                        key={diag.id}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded border transition-all",
                            diag.rank === 1 ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200"
                        )}
                    >
                        {/* Status Select on the LEFT */}
                        <div className="shrink-0">
                            <select
                                value={diag.status}
                                onChange={(e) => updateStatus(diag.id, e.target.value as any)}
                                className="h-6 rounded border-slate-300 bg-white text-[9px] font-medium px-1.5 focus:ring-slate-400 cursor-pointer hover:border-slate-400 transition-colors outline-none"
                            >
                                <option value="provisional">Provisional</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="descartado">Descartado</option>
                            </select>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-700 truncate">{diag.display}</span>
                                {diag.rank === 1 && (
                                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-600 text-[8px] font-bold text-white uppercase tracking-wide">
                                        Principal
                                    </span>
                                )}
                            </div>
                            <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">
                                {diag.system}: {diag.code || 'S/C'}
                            </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRank(diag.id)}
                                className={cn(
                                    "h-6 w-6 p-0 rounded transition-all",
                                    diag.rank === 1 ? "text-slate-600 bg-slate-100" : "text-slate-300 hover:text-slate-600 hover:bg-slate-50"
                                )}
                                title="Marcar como principal"
                            >
                                <Star className={cn("h-3 w-3", diag.rank === 1 && "fill-current")} />
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDiagnostic(diag.id)}
                                className="h-6 w-6 p-0 rounded text-slate-300 hover:text-red-600 hover:bg-red-50"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
