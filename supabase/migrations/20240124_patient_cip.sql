-- Migration: Separate surnames, add CIP and Email for patient activation
-- Formula: [2 initials Surname1][2 initials Surname2][6-digit sequence][DDMMYYYY birthdate]

-- 1. Create a sequence for the numeric part of the CIP
CREATE SEQUENCE IF NOT EXISTS patient_cip_seq START 1;

-- 2. Modify pacientes table
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS nombre TEXT,
ADD COLUMN IF NOT EXISTS apellido1 TEXT,
ADD COLUMN IF NOT EXISTS apellido2 TEXT,
ADD COLUMN IF NOT EXISTS cip TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- 3. Migration logic: Try to split existing full_name into nombre, apellido1, apellido2
-- This is a best-effort split for existing data
UPDATE pacientes 
SET 
  nombre = split_part(full_name, ' ', 1),
  apellido1 = split_part(full_name, ' ', 2),
  apellido2 = split_part(full_name, ' ', 3)
WHERE nombre IS NULL;

-- 4. Helper function for CIP sequence (can be called via RPC)
CREATE OR REPLACE FUNCTION get_next_patient_seq()
RETURNS BIGINT AS $$
  SELECT nextval('patient_cip_seq');
$$ LANGUAGE sql SECURITY DEFINER;
