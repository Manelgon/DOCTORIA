"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STREET_TYPES = [
    "Calle", "Avenida", "Plaza", "Paseo", "Ronda", "Travesía", "Carretera", "Camino",
    "Pasaje", "Glorieta", "Rambla", "Cuesta", "Carrera", "Bajada", "Subida", "Polígono",
    "Autovía", "Vía", "Bulevar", "Callejón", "Muelle", "Parque", "Jardín", "Urbanización"
]

export function StreetTypeSelect({ name = "street_type", defaultValue = "Calle", required = false }: { name?: string, defaultValue?: string, required?: boolean }) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "")
    const [search, setSearch] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const filteredTypes = STREET_TYPES.filter((t) =>
        t.toLowerCase().includes(search.toLowerCase())
    )

    // Handle clicking outside to close
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={containerRef}>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={value} required={required} />

            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                    "w-full justify-between h-10 rounded-xl px-3 bg-slate-50/50 border-slate-200 text-slate-700 font-normal hover:bg-slate-100",
                    !value && "text-slate-500"
                )}
                onClick={() => setOpen(!open)}
            >
                <span className="truncate">{value || "Tipo"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center px-3 border-b border-slate-100">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Buscar tipo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        {search && (
                            <button onClick={() => setSearch('')}>
                                <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                        {filteredTypes.length === 0 ? (
                            <div className="py-2 text-center text-xs text-slate-500 italic">
                                No encontrado.
                            </div>
                        ) : (
                            filteredTypes.map((type) => (
                                <div
                                    key={type}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer",
                                        value === type && "bg-blue-50 text-blue-700 font-medium"
                                    )}
                                    onClick={() => {
                                        setValue(type)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-blue-600",
                                            value === type ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {type}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
