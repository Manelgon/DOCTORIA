-- Structured Address Fields
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS street_type TEXT,
ADD COLUMN IF NOT EXISTS street TEXT, -- Nombre de la vía
ADD COLUMN IF NOT EXISTS street_number TEXT, -- Número
ADD COLUMN IF NOT EXISTS block TEXT, -- Bloque
ADD COLUMN IF NOT EXISTS floor TEXT, -- Piso/Planta
ADD COLUMN IF NOT EXISTS door TEXT, -- Puerta
ADD COLUMN IF NOT EXISTS city TEXT, -- Ciudad/Localidad
ADD COLUMN IF NOT EXISTS province TEXT, -- Provincia
ADD COLUMN IF NOT EXISTS zip_code TEXT; -- Código Postal

-- NOTE: existing 'address' column can remain as a deprecated field or as a full computed text in future
