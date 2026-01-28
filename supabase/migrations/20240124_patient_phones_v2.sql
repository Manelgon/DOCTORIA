-- Migration: Add prefix for secondary phone
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS phone_prefix_2 TEXT DEFAULT '+34';

-- Update existing records
UPDATE pacientes SET phone_prefix_2 = '+34' WHERE phone_prefix_2 IS NULL;
