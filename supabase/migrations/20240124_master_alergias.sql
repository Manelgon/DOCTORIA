-- Migration: Create master_alergias table and populate it
CREATE TABLE IF NOT EXISTS master_alergias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE master_alergias ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users (doctors) can read all allergies
CREATE POLICY "Allow authenticated read access to master_alergias"
ON master_alergias FOR SELECT
TO authenticated
USING (true);

-- Populate with common allergies
INSERT INTO master_alergias (nombre) VALUES
('Penicilina'),
('Amoxicilina'),
('Sulfamidas'),
('Aspirina (AAS)'),
('Ibuprofeno'),
('Naproxeno'),
('Metamizol (Nolotil)'),
('Codeína'),
('Morfina'),
('Látex'),
('Polen (Gramíneas)'),
('Polen (Olivo)'),
('Polen (Cupresáceas)'),
('Ácaros del polvo'),
('Pelo de gato'),
('Pelo de perro'),
('Veneno de avispa'),
('Veneno de abeja'),
('Frutos secos'),
('Cacahuetes'),
('Marisco'),
('Huevo'),
('Leche de vaca (proteína)'),
('Lactosa (intolerancia)'),
('Gluten (Celiaquía)'),
('Soja'),
('Melocotón (LTP)'),
('Contraste yodado'),
('Anestésicos locales'),
('Hiedra venenosa')
ON CONFLICT (nombre) DO NOTHING;
