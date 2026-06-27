-- ============================================================================
-- Fix : l'admin voit TOUS les personnages (pas seulement shared_with_admin)
-- À exécuter dans Supabase > SQL Editor
-- ============================================================================

-- 1. Recréer la fonction get_all_characters_admin sans le filtre shared_with_admin
CREATE OR REPLACE FUNCTION public.get_all_characters_admin()
RETURNS TABLE (
  id              uuid,
  user_id         uuid,
  char_name       text,
  race_name       text,
  class_name      text,
  level           int,
  sheet_data      jsonb,
  player_name     text,
  shared_with_admin boolean,
  level_up_enabled  boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = (auth.jwt() ->> 'email')
  ) THEN
    RAISE EXCEPTION 'Accès refusé — admin uniquement';
  END IF;

  RETURN QUERY
    SELECT
      c.id,
      c.user_id,
      c.char_name,
      c.race_name,
      c.class_name,
      c.level,
      c.sheet_data,
      COALESCE(c.sheet_data->>'player', c.sheet_data->>'playerName', '')::text AS player_name,
      COALESCE(c.shared_with_admin, false),
      COALESCE(c.level_up_enabled, false)
    FROM public.characters c
    WHERE c.status = 'approved'
    ORDER BY c.char_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_characters_admin() TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Fix FIX_ADMIN_SEE_ALL appliqué';
  RAISE NOTICE '→ get_all_characters_admin() retourne tous les persos (status=approved)';
  RAISE NOTICE '→ level_up_enabled inclus dans le retour';
END $$;
