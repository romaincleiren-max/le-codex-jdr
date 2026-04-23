-- ============================================================================
-- FIX : Accès anonyme (visiteurs non connectés)
-- Problème : images et campagnes invisibles sans connexion
-- Cause    : policies RLS sans TO anon, ou GRANT SELECT manquant sur anon
-- ============================================================================

-- 1. S'assurer que les tables publiques accordent SELECT au rôle anon

GRANT SELECT ON public.campaigns    TO anon;
GRANT SELECT ON public.scenarios    TO anon;
GRANT SELECT ON public.themes       TO anon;
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.tags         TO anon;

-- 2. Re-créer les policies SELECT publiques (TO anon, authenticated)

-- CAMPAIGNS
DROP POLICY IF EXISTS "Lecture publique campagnes" ON public.campaigns;
CREATE POLICY "Lecture publique campagnes" ON public.campaigns
  FOR SELECT TO anon, authenticated
  USING (true);

-- SCENARIOS
DROP POLICY IF EXISTS "Lecture publique scénarios" ON public.scenarios;
CREATE POLICY "Lecture publique scénarios" ON public.scenarios
  FOR SELECT TO anon, authenticated
  USING (true);

-- THEMES
DROP POLICY IF EXISTS "Lecture publique thèmes" ON public.themes;
CREATE POLICY "Lecture publique thèmes" ON public.themes
  FOR SELECT TO anon, authenticated
  USING (true);

-- SITE_SETTINGS
DROP POLICY IF EXISTS "Lecture publique paramètres" ON public.site_settings;
CREATE POLICY "Lecture publique paramètres" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- TAGS
DROP POLICY IF EXISTS "Lecture publique tags" ON public.tags;
CREATE POLICY "Lecture publique tags" ON public.tags
  FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Vérification : lister les policies actives sur ces tables
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('campaigns', 'scenarios', 'themes', 'site_settings', 'tags')
ORDER BY tablename, policyname;

-- ============================================================================
-- BUCKET STORAGE "images" : doit être PUBLIC dans le dashboard Supabase
-- Storage > Buckets > images > Edit > cocher "Public bucket"
-- OU via SQL :
-- UPDATE storage.buckets SET public = true WHERE id = 'images';
-- ============================================================================

UPDATE storage.buckets SET public = true WHERE id = 'images';
UPDATE storage.buckets SET public = true WHERE id = 'videos';

DO $$
BEGIN
  RAISE NOTICE '✅ GRANT SELECT accordé à anon sur campaigns, scenarios, themes, site_settings, tags';
  RAISE NOTICE '✅ Policies RLS SELECT publiques recréées avec TO anon, authenticated';
  RAISE NOTICE '✅ Buckets images et videos marqués public';
END $$;
