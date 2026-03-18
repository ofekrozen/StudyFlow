-- ============================================================
-- AUTH TRIGGER: Automatically create public.users + subscriptions
-- rows when a new Supabase Auth user registers.
--
-- Uses SECURITY DEFINER so the function runs as the postgres
-- superuser, bypassing RLS for the initial insert only.
-- The user_id is set to NEW.id (the auth UID) so that all
-- subsequent RLS policies (user_id = auth.uid()) work correctly.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the user profile row
  INSERT INTO public.users (
    user_id,
    email,
    auth_provider,
    streak_count,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_app_meta_data->>'provider',
    0,
    NOW(),
    NOW()
  );

  -- Create the free subscription row
  INSERT INTO public.subscriptions (
    user_id,
    plan,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'free',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire after every new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
