-- Migration: Add sex column to patients table
-- Description: Adds a 'sexo' column with a check constraint for valid values.

ALTER TABLE pacientes 
ADD COLUMN sexo VARCHAR(20) CHECK (sexo IN ('masculino', 'femenino', 'otro'));

-- Add comment for documentation
COMMENT ON COLUMN pacientes.sexo IS 'Sexo biológico o identidad de género del paciente (masculino, femenino, otro)';
