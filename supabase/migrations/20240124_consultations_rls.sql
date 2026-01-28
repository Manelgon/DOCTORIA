-- Enable RLS (already enabled in schema but good for robust migration)
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;

-- 1. VIEW POLICY: Doctors can view consultations for patients they have access to.
-- This works by leveraging the existing RLS on the 'pacientes' table.
-- If the user can 'SELECT id FROM pacientes', they have access to that patient.
CREATE POLICY "Medicos ven consultas de sus pacientes" ON consultas FOR SELECT
USING (
    patient_id IN (
        SELECT id FROM pacientes
    )
);

-- 2. INSERT POLICY: Doctors can insert consultations if:
-- a) They are the author (medico_id = auth.uid())
-- b) They have access to the patient
CREATE POLICY "Medicos crean consultas" ON consultas FOR INSERT
WITH CHECK (
    auth.uid() = medico_id AND
    patient_id IN (
        SELECT id FROM pacientes
    )
);

-- 3. UPDATE POLICY: Doctors can only edit their OWN consultations
CREATE POLICY "Medicos editan sus propias consultas" ON consultas FOR UPDATE
USING (auth.uid() = medico_id);

-- 4. DELETE POLICY: Doctors can only delete their OWN consultations
CREATE POLICY "Medicos borran sus propias consultas" ON consultas FOR DELETE
USING (auth.uid() = medico_id);
