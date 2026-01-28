-- Migration: Sync patient is_active status with Auth email verification
-- When a user confirms their email in Supabase Auth, the record in 'pacientes' will be activated.

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION public.sync_patient_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- We only care about patients (we can check metadata or just try updating)
  -- If email_confirmed_at moves from NULL to a value
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at = '') THEN
    UPDATE public.pacientes
    SET is_active = TRUE
    WHERE id = NEW.id;
  END IF;

  -- If a user is deactivated/unconfirmed (e.g. email change)
  IF NEW.email_confirmed_at IS NULL AND OLD.email_confirmed_at IS NOT NULL THEN
    UPDATE public.pacientes
    SET is_active = FALSE
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to auth.users
-- Note: Trigger must be created in a schema that has access to auth.users (usually public or via specific Supabase setup)
DROP TRIGGER IF EXISTS tr_sync_patient_activation ON auth.users;
CREATE TRIGGER tr_sync_patient_activation
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_patient_activation();

-- 3. Initial Sync (Optional: Update any already confirmed patients)
UPDATE public.pacientes p
SET is_active = TRUE
FROM auth.users u
WHERE p.id = u.id AND u.email_confirmed_at IS NOT NULL;
