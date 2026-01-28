"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getMasterAlergias } from "@/app/dashboard/actions/patients"

interface AllergySelectProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function AllergySelect({ value, onChange, placeholder = "Buscar alergia..." }: AllergySelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [options, setOptions] = React.useState<string[]>([])
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const loadAlergias = async () => {
            const data = await getMasterAlergias()
            setOptions(data)
        }
        loadAlergias()
    }, [])

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase())
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
        <div className="relative flex-1" ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-10 rounded-xl px-3 bg-white border-slate-200 text-slate-700 font-normal hover:bg-slate-50 overflow-hidden"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate">
                    {value || <span className="text-slate-500">{placeholder}</span>}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center px-3 border-b border-slate-100">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ej: Penicilina"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && search.trim() !== "") {
                                    e.preventDefault()
                                    onChange(search)
                                    setOpen(false)
                                    setSearch("")
                                }
                            }}
                            autoFocus
                        />
                        {search && (
                            <button onClick={() => setSearch('')}>
                                <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div
                                className="py-3 px-2 text-xs text-blue-600 font-medium cursor-pointer hover:bg-blue-50 rounded-lg"
                                onClick={() => {
                                    onChange(search)
                                    setOpen(false)
                                    setSearch("")
                                }}
                            >
                                Añadir "{search}" como nueva alergia
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 transition-colors",
                                        value === option && "bg-blue-50 text-blue-700 font-medium"
                                    )}
                                    onClick={() => {
                                        onChange(option)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
