-- Migration: Create dedicated table for patient allergies
CREATE TABLE IF NOT EXISTS paciente_alergias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    estado TEXT CHECK (estado IN ('Sospecha', 'Activa', 'Inactiva')),
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE paciente_alergias ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (doctors)
CREATE POLICY "Allow authenticated full access to paciente_alergias"
ON paciente_alergias FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_paciente_alergias_paciente_id ON paciente_alergias(paciente_id);
