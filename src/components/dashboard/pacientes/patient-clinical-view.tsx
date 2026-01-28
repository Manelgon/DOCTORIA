"use client"

import { useState } from "react"
import {
    Contact,
    Clock,
    FileText,
    CreditCard,
    Activity,
    Calendar,
    MapPin,
    Smartphone,
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    Mail,
    Mars,
    Venus,
    HelpCircle
} from "lucide-react"
import { ConsultationsTable } from "@/components/dashboard/consultas/consultations-table"
import { CreateConsultationForm } from "@/components/dashboard/consultas/create-consultation-form"
import { Button } from "@/components/ui/button"
import { DocumentsTable } from "@/components/dashboard/documents/documents-table"
import { DocumentCreationModal } from "@/components/dashboard/documents/document-creation-modal"
import { Plus } from "lucide-react"

interface PatientClinicalViewProps {
    patient: any
    consultations: any[]
    doctorProfile: any
    antecedents: any[]
    allergies: any[]
    treatments: any[]
    age: number | null
}

export function PatientClinicalView({ patient, consultations, doctorProfile, antecedents, allergies, treatments, age }: PatientClinicalViewProps) {
    const [activeTab, setActiveTab] = useState<'new' | 'info' | 'history' | 'docs' | 'plan'>('new')
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean
        initialData?: {
            templateId?: string
            customNotes?: string
            step?: number
        }
    }>({ isOpen: false })

    return (
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {/* Admin Navigation */}
            <div className="w-full bg-gray-50 border-b border-gray-200 p-3 flex-none">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-1">Navegación Paciente</p>

                <div className="flex items-center gap-2 px-2 overflow-x-auto custom-scrollbar pb-1">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors text-xs whitespace-nowrap ${activeTab === 'new'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                            }`}
                    >
                        <ClipboardList className="h-4 w-4" />
                        Nueva Consulta
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors text-xs whitespace-nowrap ${activeTab === 'history'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                            }`}
                    >
                        <Clock className="h-4 w-4" />
                        Historial Consultas
                    </button>

                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors text-xs whitespace-nowrap ${activeTab === 'docs'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                            }`}
                    >
                        <FileText className="h-4 w-4" />
                        Documentos y Pruebas
                    </button>

                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors text-xs whitespace-nowrap ${activeTab === 'plan'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                            }`}
                    >
                        <CreditCard className="h-4 w-4" />
                        Plan de Tratamiento
                    </button>

                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors text-xs whitespace-nowrap ${activeTab === 'info'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                            }`}
                    >
                        <Contact className="h-4 w-4" />
                        Información General
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className={activeTab === 'new' ? "block space-y-4" : "hidden"}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                            Formulario de Nueva Consulta
                        </h2>
                        <p className="text-sm text-gray-600 font-medium">
                            {new Date().toLocaleDateString("es-ES", {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}, {new Date().toLocaleTimeString("es-ES", {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="p-1">
                        <CreateConsultationForm patientId={patient.id} doctorProfile={doctorProfile} />
                    </div>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Contact className="h-5 w-5 text-blue-600" />
                            Ficha de Datos Generales
                        </h2>

                        {/* Single Card with Two Columns Inside */}
                        <div className="bg-gray-50 rounded border border-gray-200 p-5">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* LEFT SIDE - Medical Data */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Datos Médicos
                                    </h3>

                                    {/* Basic Medical Info */}
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de Nacimiento</p>
                                            <p className="text-sm font-semibold text-gray-700">
                                                {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString("es-ES", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                }) : '---'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Edad</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {age !== null ? `${age} años` : '---'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sexo</p>
                                            <div className="flex items-center gap-2">
                                                {patient.sexo?.toLowerCase().includes('mujer') || patient.sexo?.toLowerCase().includes('femenino') ? (
                                                    <div className="flex items-center gap-2 text-pink-600 font-semibold text-sm bg-pink-50 px-2 py-1 rounded-md border border-pink-100">
                                                        <Venus className="h-4 w-4" />
                                                        <span>Femenino</span>
                                                    </div>
                                                ) : patient.sexo?.toLowerCase().includes('hombre') || patient.sexo?.toLowerCase().includes('masculino') ? (
                                                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                                        <Mars className="h-4 w-4" />
                                                        <span>Masculino</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                        <HelpCircle className="h-4 w-4" />
                                                        <span>No especificado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grupo Sanguíneo</p>
                                            <p className="text-sm font-semibold text-red-600">{patient.blood_group || 'No especificado'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDE - Contact Data */}
                                <div>
                                    <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Contact className="h-4 w-4" />
                                        Datos de Contacto
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Left Column */}
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Identificación (DNI/NIE)</p>
                                                <p className="text-base font-semibold text-gray-700">{patient.dni || '---'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono Principal</p>
                                                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                                    <Smartphone className="h-4 w-4 text-slate-400" />
                                                    {patient.phone ? `${patient.phone_prefix || ''} ${patient.phone}` : '---'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dirección Postal</p>
                                                <div className="flex items-start gap-2 text-gray-700 font-semibold">
                                                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                                    <div>
                                                        {patient.street ? (
                                                            <>
                                                                <p>{patient.street_type} {patient.street}, {patient.street_number}</p>
                                                                {(patient.floor || patient.door) && (
                                                                    <p className="text-sm">{patient.floor && `${patient.floor}`}{patient.door && ` ${patient.door}`}</p>
                                                                )}
                                                                <p className="text-sm">{patient.zip_code && `${patient.zip_code} `}{patient.city}{patient.province && `, ${patient.province}`}</p>
                                                            </>
                                                        ) : (
                                                            <p>{patient.address || '---'}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CIP</p>
                                                <p className="text-base font-semibold text-gray-700">{patient.cip || '---'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono Secundario</p>
                                                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                                    <Smartphone className="h-4 w-4 text-slate-400" />
                                                    {patient.phone_2 ? `${patient.phone_prefix_2 || ''} ${patient.phone_2}` : '---'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                                                <div className="flex items-center gap-2 text-gray-700 font-semibold truncate">
                                                    <Mail className="h-4 w-4 text-slate-400" />
                                                    <span className="truncate">{patient.email || '---'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de Alta</p>
                                                <p className="text-base font-semibold text-gray-700">
                                                    {new Date(patient.created_at).toLocaleDateString("es-ES", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric"
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="h-px bg-gray-200 my-5"></div>

                            {/* Bottom Row: Medical History in 3 Columns (Full Width) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Allergies Card */}
                                <div className="bg-rose-50/50 rounded border border-rose-200 p-4">
                                    <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Alergias ({allergies.length})
                                    </p>
                                    {allergies.length > 0 ? (
                                        <div className="space-y-2">
                                            {allergies.map((allergy: any, idx: number) => (
                                                <div key={idx} className="text-xs text-gray-700">
                                                    <span className="font-semibold">• {allergy.value}</span>
                                                    {allergy.status && <span className="text-[10px] text-gray-500"> ({allergy.status})</span>}
                                                    {allergy.comment && <p className="text-[10px] text-gray-500 ml-2 mt-0.5">{allergy.comment}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">Sin alergias registradas</p>
                                    )}
                                </div>

                                {/* Antecedents Card */}
                                <div className="bg-indigo-50/50 rounded border border-indigo-200 p-4">
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Antecedentes ({antecedents.length})
                                    </p>
                                    {antecedents.length > 0 ? (
                                        <div className="space-y-2">
                                            {antecedents.map((antecedent: any, idx: number) => (
                                                <div key={idx} className="text-xs text-gray-700">
                                                    <span className="font-semibold">• {antecedent.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">Sin antecedentes registrados</p>
                                    )}
                                </div>

                                {/* Treatments Card */}
                                <div className="bg-emerald-50/50 rounded border border-emerald-200 p-4">
                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        Tratamientos ({treatments.length})
                                    </p>
                                    {treatments.length > 0 ? (
                                        <div className="space-y-2">
                                            {treatments.map((treatment: any, idx: number) => (
                                                <div key={idx} className="text-xs text-gray-700">
                                                    <span className="font-semibold">• {treatment.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">Sin tratamientos activos</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5 text-blue-600" />
                            Historial Clínico
                        </h2>
                        <ConsultationsTable consultations={consultations} />
                    </>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Documentos y Firmas
                        </h2>
                        <DocumentsTable
                            documents={patient.patient_documents || []}
                            patientEmail={patient.email}
                            onCreateDocument={(data) => setModalConfig({ isOpen: true, initialData: data })}
                            patientId={patient.id}
                            patientCip={patient.cip}
                        />
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-12 text-center space-y-4">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                                <CreditCard className="h-8 w-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Módulo en construcción</h3>
                                <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">
                                    Esta funcionalidad estará disponible en la próxima actualización del sistema.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <DocumentCreationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ isOpen: false })}
                patient={patient}
                doctor={doctorProfile}
                initialData={modalConfig.initialData}
            />
        </div>
    )
}
