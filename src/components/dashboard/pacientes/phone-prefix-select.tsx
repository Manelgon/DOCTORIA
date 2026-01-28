"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PREFIXES = [
    { code: "+34", country: "España", flag: "🇪🇸" },
    { code: "+351", country: "Portugal", flag: "🇵🇹" },
    { code: "+33", country: "Francia", flag: "🇫🇷" },
    { code: "+44", country: "Reino Unido", flag: "🇬🇧" },
    { code: "+1", country: "Estados Unidos", flag: "🇺🇸" },
    { code: "+52", country: "México", flag: "🇲🇽" },
    { code: "+49", country: "Alemania", flag: "🇩🇪" },
    { code: "+39", country: "Italia", flag: "🇮🇹" },
    { code: "+41", country: "Suiza", flag: "🇨🇭" },
    { code: "+32", country: "Bélgica", flag: "🇧🇪" },
    { code: "+31", country: "Países Bajos", flag: "🇳🇱" },
    { code: "+46", country: "Suecia", flag: "🇸🇪" },
    { code: "+47", country: "Noruega", flag: "🇳🇴" },
    { code: "+45", country: "Dinamarca", flag: "🇩🇰" },
    { code: "+353", country: "Irlanda", flag: "🇮🇪" },
    { code: "+30", country: "Grecia", flag: "🇬🇷" },
    { code: "+54", country: "Argentina", flag: "🇦🇷" },
    { code: "+56", country: "Chile", flag: "🇨🇱" },
    { code: "+57", country: "Colombia", flag: "🇨🇴" },
    { code: "+51", country: "Perú", flag: "🇵🇪" },
    { code: "+593", country: "Ecuador", flag: "🇪🇨" },
    { code: "+58", country: "Venezuela", flag: "🇻🇪" },
    { code: "+55", country: "Brasil", flag: "🇧🇷" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+81", country: "Japón", flag: "🇯🇵" },
    { code: "+82", country: "Corea del Sur", flag: "🇰🇷" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+7", country: "Rusia", flag: "🇷🇺" },
    { code: "+212", country: "Marruecos", flag: "🇲🇦" },
    { code: "+20", country: "Egipto", flag: "🇪🇬" },
    { code: "+27", country: "Sudáfrica", flag: "🇿🇦" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+64", country: "Nueva Zelanda", flag: "🇳🇿" }
]

export function PhonePrefixSelect({ name = "phone_prefix", defaultValue = "+34" }: { name?: string, defaultValue?: string }) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "+34")
    const [search, setSearch] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const filteredPrefixes = PREFIXES.filter((p) =>
        p.country.toLowerCase().includes(search.toLowerCase()) ||
        p.code.includes(search)
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

    const selectedPrefix = PREFIXES.find(p => p.code === value)

    return (
        <div className="relative" ref={containerRef}>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={value} />

            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                    "w-[100px] justify-between h-11 rounded-xl px-2 bg-white border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50",
                    !value && "text-slate-500"
                )}
                onClick={() => setOpen(!open)}
            >
                <span className="flex items-center gap-2 truncate">
                    {selectedPrefix ? (
                        <>
                            <span className="text-base">{selectedPrefix.flag}</span>
                            {selectedPrefix.code}
                        </>
                    ) : (
                        value
                    )}
                </span>
                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-[240px] mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center px-3 border-b border-slate-100">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Buscar país o código..."
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
                        {filteredPrefixes.length === 0 ? (
                            <div className="py-2 text-center text-xs text-slate-500 italic">
                                No encontrado.
                            </div>
                        ) : (
                            filteredPrefixes.map((p) => (
                                <div
                                    key={p.country}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer justify-between",
                                        value === p.code && "bg-blue-50 text-blue-700 font-bold"
                                    )}
                                    onClick={() => {
                                        setValue(p.code)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{p.flag}</span>
                                        <span className="truncate max-w-[120px]">{p.country}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-xs font-mono">{p.code}</span>
                                        <Check
                                            className={cn(
                                                "h-3 w-3 text-blue-600",
                                                value === p.code ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
