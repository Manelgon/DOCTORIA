-- Fix: Correct sync_patient_activation function to avoid type mismatch
-- The previous version compared timestamptz to '' which causes a 500 error.

CREATE OR REPLACE FUNCTION public.sync_patient_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Correct comparison for timestamptz
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.pacientes 
    SET is_active = TRUE 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
