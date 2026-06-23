-- ============================================================================
-- FIX : Lecture admin de tous les personnages (bypass RLS)
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================================

-- Fonction SECURITY DEFINER : bypass le RLS, vérifie que le caller est admin
CREATE OR REPLACE FUNCTION get_all_characters_admin()
RETURNS TABLE (
  id UUID,
  char_name TEXT,
  player_name TEXT,
  class_name TEXT,
  race_name TEXT,
  level INTEGER,
  current_hp INTEGER,
  max_hp INTEGER,
  ac INTEGER,
  portrait_url TEXT,
  portrait_emoji TEXT,
  status TEXT,
  sheet_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_email TEXT;
BEGIN
  caller_email := auth.email();

  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.email = caller_email
  ) THEN
    RAISE EXCEPTION 'Accès refusé : réservé aux administrateurs';
  END IF;

  RETURN QUERY
    SELECT
      c.id, c.char_name, c.player_name, c.class_name, c.race_name,
      c.level, c.current_hp, c.max_hp, c.ac,
      c.portrait_url, c.portrait_emoji, c.status,
      c.sheet_data, c.user_id, c.created_at
    FROM characters c
    WHERE c.status != 'archived'
    ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_characters_admin() TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction get_all_characters_admin() créée';
  RAISE NOTICE '→ Bypass RLS pour admin, vérifie admin_users.email';
END $$;
