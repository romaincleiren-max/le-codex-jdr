-- ============================================================================
-- FIX : Lecture publique sur les tables visibles par tous les visiteurs
-- Problème : RLS activé sans policy SELECT → anonymes voient une page vide
-- ============================================================================

-- CAMPAIGNS
DROP POLICY IF EXISTS "Lecture publique campagnes" ON public.campaigns;
CREATE POLICY "Lecture publique campagnes" ON public.campaigns
  FOR SELECT USING (true);

-- SCENARIOS
DROP POLICY IF EXISTS "Lecture publique scénarios" ON public.scenarios;
CREATE POLICY "Lecture publique scénarios" ON public.scenarios
  FOR SELECT USING (true);

-- THEMES
DROP POLICY IF EXISTS "Lecture publique thèmes" ON public.themes;
CREATE POLICY "Lecture publique thèmes" ON public.themes
  FOR SELECT USING (true);

-- SITE_SETTINGS
DROP POLICY IF EXISTS "Lecture publique paramètres" ON public.site_settings;
CREATE POLICY "Lecture publique paramètres" ON public.site_settings
  FOR SELECT USING (true);

-- TAGS (si la table existe)
DROP POLICY IF EXISTS "Lecture publique tags" ON public.tags;
CREATE POLICY "Lecture publique tags" ON public.tags
  FOR SELECT USING (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Lecture publique activée sur campaigns, scenarios, themes, site_settings, tags';
END $$;
