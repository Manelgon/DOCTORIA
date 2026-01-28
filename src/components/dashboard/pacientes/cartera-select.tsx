"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Cartera {
    id: string
    nombre: string
}

interface CarteraSelectProps {
    carteras: Cartera[]
    name?: string
    defaultValue?: string
    required?: boolean
}

export function CarteraSelect({ carteras, name = "cartera_id", defaultValue = "", required = false }: CarteraSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "")
    const [search, setSearch] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const filteredCarteras = carteras.filter((c) =>
        c.nombre.toLowerCase().includes(search.toLowerCase())
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

    const selectedCartera = carteras.find((c) => c.id === value)

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
                    "w-full justify-between h-12 rounded-xl px-4 bg-slate-50/30 border-slate-200 text-slate-900 font-bold hover:bg-slate-50 focus:ring-2 focus:ring-blue-500/20",
                    !value && "text-slate-500 font-normal"
                )}
                onClick={() => setOpen(!open)}
            >
                <span className="flex items-center gap-2 truncate">
                    {value ? (
                        <>
                            <Briefcase className="h-4 w-4 text-blue-600 shrink-0" />
                            {selectedCartera?.nombre}
                        </>
                    ) : (
                        "Seleccione una cartera"
                    )}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center px-3 border-b border-slate-100">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                            placeholder="Buscar cartera..."
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
                        {filteredCarteras.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500 italic">
                                No se encontraron resultados.
                            </div>
                        ) : (
                            filteredCarteras.map((cartera) => (
                                <div
                                    key={cartera.id}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer font-medium",
                                        value === cartera.id && "bg-blue-50 text-blue-700 font-bold"
                                    )}
                                    onClick={() => {
                                        setValue(cartera.id)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-blue-600",
                                            value === cartera.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {cartera.nombre}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
