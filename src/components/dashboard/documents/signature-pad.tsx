"use client"

import { useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Eraser, Check, X } from "lucide-react"

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void
    onClear?: () => void
    label?: string
    placeholder?: string
}

export function SignaturePad({ onSave, onClear, label, placeholder }: SignaturePadProps) {
    const sigPad = useRef<SignatureCanvas>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    const clear = () => {
        sigPad.current?.clear()
        setIsEmpty(true)
        if (onClear) onClear()
    }

    const save = () => {
        if (sigPad.current?.isEmpty()) return
        const dataUrl = sigPad.current?.getTrimmedCanvas().toDataURL("image/png")
        if (dataUrl) {
            onSave(dataUrl)
        }
    }

    return (
        <div className="space-y-3">
            {label && (
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden cursor-crosshair hover:border-blue-300 transition-colors">
                    <SignatureCanvas
                        ref={sigPad}
                        penColor="#0f172a"
                        canvasProps={{
                            className: "w-full h-40",
                        }}
                        onBegin={() => setIsEmpty(false)}
                    />

                    {isEmpty && placeholder && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-sm text-slate-300 italic">{placeholder}</p>
                        </div>
                    )}
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 bg-white/80 backdrop-blur-sm border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
                        onClick={clear}
                        type="button"
                    >
                        <Eraser className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between px-1">
                <p className="text-[10px] text-slate-400 italic">
                    Dibuje su firma dentro del recuadro
                </p>
                {!isEmpty && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] font-bold uppercase tracking-tight gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50"
                        onClick={save}
                        type="button"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Confirmar Firma
                    </Button>
                )}
            </div>
        </div>
    )
}
