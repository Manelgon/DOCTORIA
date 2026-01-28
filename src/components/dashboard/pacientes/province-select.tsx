"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PROVINCES = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Baleares",
    "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba",
    "Cuenca", "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Jaén", "La Rioja",
    "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense",
    "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
    "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Bizkaia", "Zamora", "Zaragoza",
    "Ceuta", "Melilla"
]

export function ProvinceSelect({ name = "province", defaultValue = "", required = false }: { name?: string, defaultValue?: string, required?: boolean }) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "")
    const [search, setSearch] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const filteredProvinces = PROVINCES.filter((province) =>
        province.toLowerCase().includes(search.toLowerCase())
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
                className="w-full justify-between h-10 rounded-xl px-3 bg-white border-slate-200 text-slate-700 font-normal hover:bg-slate-50"
                onClick={() => setOpen(!open)}
            >
                {value
                    ? PROVINCES.find((province) => province === value)
                    : <span className="text-slate-500">Seleccione provincia...</span>}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center px-3 border-b border-slate-100">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Buscar provincia..."
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
                        {filteredProvinces.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500 italic">
                                No se encontraron resultados.
                            </div>
                        ) : (
                            filteredProvinces.map((province) => (
                                <div
                                    key={province}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer",
                                        value === province && "bg-blue-50 text-blue-700 font-medium"
                                    )}
                                    onClick={() => {
                                        setValue(province)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === province ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {province}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
