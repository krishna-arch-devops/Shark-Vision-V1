-- SHARKVISION Super Admin Bootstrap SQL Script
-- Execute this once in the Supabase SQL editor to create or promote the initial Super Admin.

-- Step 1: Replace with your chosen administrative credentials
DO $$
DECLARE
  target_email TEXT := 'admin@sharkvision.in';
  target_user_id UUID;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NOT NULL THEN
    -- Update existing profile to SUPER_ADMIN
    UPDATE public.profiles
    SET role = 'SUPER_ADMIN',
        full_name = 'Platform Super Administrator',
        is_active = TRUE,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = target_user_id;

    -- Record in audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
    VALUES (
      target_user_id,
      'BOOTSTRAP_SUPER_ADMIN',
      'profiles',
      target_user_id,
      jsonb_build_object('email', target_email, 'promoted_at', NOW())
    );

    RAISE NOTICE 'Successfully promoted % to SUPER_ADMIN', target_email;
  ELSE
    RAISE NOTICE 'User % not found in auth.users. Please sign up or create the user in Supabase Auth first, then re-run this script.', target_email;
  END IF;
END $$;
