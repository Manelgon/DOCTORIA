"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const GENDERS = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
    { label: 'Otro', value: 'otro' }
]

export function SexSelect({ name = "sexo", defaultValue = "", required = false }: { name?: string, defaultValue?: string, required?: boolean }) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue || "")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selectedGender = GENDERS.find(g => g.value === value)

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
                    "w-full justify-between h-11 rounded-xl px-3 bg-white border-slate-200 text-slate-700 font-normal hover:bg-slate-50",
                    !value && "text-slate-500"
                )}
                onClick={() => setOpen(!open)}
            >
                <span className="flex items-center gap-2">
                    {value ? (
                        <>
                            <User className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="font-bold text-slate-900">{selectedGender?.label}</span>
                        </>
                    ) : (
                        "Seleccione sexo..."
                    )}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {GENDERS.map((gender) => (
                            <div
                                key={gender.value}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer font-bold",
                                    value === gender.value && "bg-blue-50 text-blue-700"
                                )}
                                onClick={() => {
                                    setValue(gender.value)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4 text-blue-600",
                                        value === gender.value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {gender.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
