-- ============================================================================
-- Permission de montée de niveau (admin → joueur) — Forge du Héros
-- À exécuter dans Supabase > SQL Editor
-- ============================================================================

-- 1. Ajouter la colonne level_up_enabled à characters
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS level_up_enabled BOOLEAN DEFAULT false;

-- 2. Fonction SECURITY DEFINER : seul l'admin peut écrire cette colonne
--    (bypass RLS, mais vérifie que l'appelant est bien dans admin_users)
CREATE OR REPLACE FUNCTION public.admin_toggle_level_up(char_id uuid, enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = (auth.jwt() ->> 'email')
  ) THEN
    RAISE EXCEPTION 'Accès refusé — admin uniquement';
  END IF;
  UPDATE public.characters SET level_up_enabled = enabled WHERE id = char_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_toggle_level_up(uuid, boolean) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration ADD_LEVEL_UP_PERMISSION appliquée';
  RAISE NOTICE '→ Colonne level_up_enabled ajoutée à characters (default false)';
  RAISE NOTICE '→ Fonction admin_toggle_level_up() créée (SECURITY DEFINER)';
END $$;
