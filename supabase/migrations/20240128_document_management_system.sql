-- Create patient_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS patient_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  type text CHECK (type IN ('analitica', 'imagen', 'informe', 'receta', 'otro')) DEFAULT 'otro',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for patient_documents
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Policies for patient_documents
DROP POLICY IF EXISTS "Owners can view documents of their portfolio patients" ON patient_documents;
CREATE POLICY "Owners can view documents of their portfolio patients"
  ON patient_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pacientes p
      JOIN carteras c ON p.cartera_id = c.id
      WHERE p.id = patient_documents.patient_id
      AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Shared users can view documents" ON patient_documents;
CREATE POLICY "Shared users can view documents"
  ON patient_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carteras_acceso ca
      JOIN carteras c ON ca.cartera_id = c.id
      JOIN pacientes p ON p.cartera_id = c.id
      WHERE p.id = patient_documents.patient_id
      AND ca.medico_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert documents" ON patient_documents;
CREATE POLICY "Authenticated users can insert documents"
  ON patient_documents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');


-- Add new columns to patient_documents
ALTER TABLE patient_documents 
ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS identifier_code TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- HTML/Markdown content with placeholders
    type TEXT CHECK (type IN ('consentimiento', 'receta', 'informe', 'otro')) DEFAULT 'otro',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Policies for templates
DROP POLICY IF EXISTS "Anyone can view active templates" ON document_templates;
CREATE POLICY "Anyone can view active templates" 
    ON document_templates FOR SELECT 
    USING (is_active = true);

-- Storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON storage.objects;

-- 1. INSERT: Allow any authenticated user to upload files to this bucket
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents');

-- 2. UPDATE: Allow users to update their OWN files (needed for upsert)
CREATE POLICY "Allow authenticated users to update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'patient-documents' AND owner = auth.uid());

-- 3. SELECT: Allow users to view files they OWN OR files linked to patients they have access to
CREATE POLICY "Allow authenticated users to view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'patient-documents' AND (
        owner = auth.uid() OR -- The user uploaded it themselves (critical for immediate verify)
        EXISTS (
            SELECT 1 FROM patient_documents pd
            JOIN pacientes p ON pd.patient_id = p.id
            JOIN carteras c ON p.cartera_id = c.id
            WHERE pd.url LIKE '%' || storage.objects.name
            AND (
                c.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM carteras_acceso ca
                    WHERE ca.cartera_id = c.id
                    AND ca.medico_id = auth.uid()
                )
            )
        )
    )
);
