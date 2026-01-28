import {
    Calendar,
    Users,
    ClipboardList,
    Pill,
    TestTube,
    FileText,
    Briefcase
} from "lucide-react"

export const doctorNavigation = [
    { name: "Agenda", href: "/dashboard", icon: Calendar },
    { name: "Carteras", href: "/dashboard/carteras", icon: Briefcase },
    { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
    { name: "Consultas", href: "/dashboard/consultas", icon: ClipboardList },
    { name: "Recetas (REMPe)", href: "/dashboard/recetas", icon: Pill },
    { name: "Pruebas", href: "/dashboard/pruebas", icon: TestTube },
    { name: "Documentos", href: "/dashboard/documentos", icon: FileText },
]

export const adminNavigation = [
    { name: "Profesionales", href: "/admin/medicos", icon: Users },
    { name: "Carteras", href: "/admin/carteras", icon: Briefcase },
]
