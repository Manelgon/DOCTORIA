-- Migration: Add blood group and medical history to patients
ALTER TABLE pacientes 
ADD COLUMN blood_group TEXT,
ADD COLUMN medical_history JSONB DEFAULT '[]';

-- Comment for clarity
COMMENT ON COLUMN pacientes.medical_history IS 'Array of objects { type: "antecedente" | "alergia", value: string }';
