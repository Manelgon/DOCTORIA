-- Migration: Add secondary phone and prefix to patients
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS phone_prefix TEXT DEFAULT '+34',
ADD COLUMN IF NOT EXISTS phone_2 TEXT;

-- Update existing records to have the default prefix
UPDATE pacientes SET phone_prefix = '+34' WHERE phone_prefix IS NULL;
