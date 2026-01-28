-- Add signos_vitales column to consultas table
ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS signos_vitales JSONB DEFAULT '[]'::jsonb;
