-- Migration: Update medical_history documentation
COMMENT ON COLUMN pacientes.medical_history IS 'Array of objects { type: "antecedente" | "alergia" | "tratamiento", value: string, status?: "Sospecha" | "Activa" | "Inactiva", comment?: string }';
