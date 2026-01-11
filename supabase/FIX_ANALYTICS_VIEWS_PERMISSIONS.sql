-- ============================================================================
-- CORRECTION: Politiques RLS manquantes pour les tables utilisées par les vues analytics
-- ============================================================================
-- Problème: Les vues avec SECURITY INVOKER nécessitent que l'utilisateur
-- ait accès RLS aux tables sous-jacentes (scenarios, campaigns)
-- ============================================================================

-- 1. Vérifier que RLS est activé sur les tables
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 2. Créer des politiques RLS pour permettre la lecture publique des scénarios et campagnes
--    (car les vues analytics ont besoin d'y accéder)

-- Politique: Tout le monde peut lire les scénarios (données publiques)
DROP POLICY IF EXISTS "Scenarios are viewable by everyone" ON scenarios;
CREATE POLICY "Scenarios are viewable by everyone"
ON scenarios FOR SELECT
TO anon, authenticated
USING (true);

-- Politique: Tout le monde peut lire les campagnes (données publiques)
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
CREATE POLICY "Campaigns are viewable by everyone"
ON campaigns FOR SELECT
TO anon, authenticated
USING (true);

-- 3. S'assurer que les permissions GRANT sont en place
GRANT SELECT ON scenarios TO anon, authenticated;
GRANT SELECT ON campaigns TO anon, authenticated;
GRANT SELECT ON analytics_realtime TO authenticated;
GRANT SELECT ON analytics_by_theme TO authenticated;
GRANT SELECT ON analytics_top_scenarios TO authenticated;
GRANT SELECT ON analytics_peak_hours TO authenticated;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Testez en tant qu'admin authentifié:
-- SELECT * FROM analytics_realtime;
-- SELECT * FROM analytics_by_theme;
-- SELECT * FROM analytics_top_scenarios LIMIT 5;
-- SELECT * FROM analytics_peak_hours LIMIT 5;
-- ============================================================================

-- ============================================================================
-- EXPLICATION DU PROBLÈME
-- ============================================================================
-- Avec SECURITY INVOKER, les vues exécutent les requêtes avec les permissions
-- de l'utilisateur qui appelle la vue, pas celles du créateur.
--
-- La vue analytics_top_scenarios fait des JOINs sur:
-- - analytics_events (OK: admins ont accès via RLS)
-- - scenarios (MANQUANT: pas de politique RLS)
-- - campaigns (MANQUANT: pas de politique RLS)
--
-- Sans politiques RLS sur scenarios et campaigns, même les admins authentifiés
-- ne peuvent pas les lire, donc les vues retournent 403 Forbidden.
--
-- Solution: Permettre la lecture publique de scenarios et campaigns
-- (ce sont des données publiques visibles sur le site de toute façon)
-- ============================================================================
