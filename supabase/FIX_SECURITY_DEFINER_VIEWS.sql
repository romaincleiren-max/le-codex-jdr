-- ============================================================================
-- CORRECTION SÉCURITÉ: Remplacer SECURITY DEFINER par SECURITY INVOKER
-- ============================================================================
-- Problème détecté par Supabase:
-- Les vues avec SECURITY DEFINER utilisent les permissions du créateur
-- au lieu de celles de l'utilisateur qui les interroge.
--
-- Solution: Utiliser SECURITY INVOKER pour que les vues respectent
-- les permissions RLS de l'utilisateur qui les interroge.
-- ============================================================================

-- 1. Supprimer les anciennes vues
DROP VIEW IF EXISTS analytics_by_theme CASCADE;
DROP VIEW IF EXISTS analytics_realtime CASCADE;
DROP VIEW IF EXISTS analytics_top_scenarios CASCADE;
DROP VIEW IF EXISTS analytics_peak_hours CASCADE;

-- 2. Recréer les vues avec SECURITY INVOKER

-- Vue pour les statistiques en temps réel (dernières 24h)
CREATE OR REPLACE VIEW analytics_realtime
WITH (security_invoker = true)
AS
SELECT
    COUNT(*) FILTER (WHERE event_type = 'page_view') as total_visits,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) FILTER (WHERE event_type = 'scenario_view') as scenario_views,
    COUNT(*) FILTER (WHERE event_type = 'download') as total_downloads,
    COUNT(*) FILTER (WHERE event_type = 'cart_add') as cart_adds,
    COUNT(*) FILTER (WHERE event_type = 'purchase') as purchases,
    COALESCE(SUM(event_value) FILTER (WHERE event_type = 'purchase'), 0) as revenue
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Vue pour les statistiques par thème (avec SECURITY INVOKER)
CREATE OR REPLACE VIEW analytics_by_theme
WITH (security_invoker = true)
AS
SELECT
    event_category as theme,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_visitors
FROM analytics_events
WHERE event_type IN ('page_view', 'scenario_view')
    AND event_category IN ('medieval', 'lovecraft', 'scifi')
    AND created_at > NOW() - INTERVAL '30 days'
GROUP BY event_category
ORDER BY total_views DESC;

-- Vue pour les scénarios les plus populaires (avec SECURITY INVOKER)
CREATE OR REPLACE VIEW analytics_top_scenarios
WITH (security_invoker = true)
AS
SELECT
    s.id,
    s.title,
    s.display_name,
    c.name as campaign_name,
    COUNT(DISTINCT ae.session_id) FILTER (WHERE ae.event_type = 'scenario_view') as unique_views,
    COUNT(*) FILTER (WHERE ae.event_type = 'download') as downloads,
    COUNT(*) FILTER (WHERE ae.event_type = 'cart_add') as cart_adds
FROM scenarios s
LEFT JOIN campaigns c ON s.campaign_id = c.id
LEFT JOIN analytics_events ae ON ae.scenario_id = s.id
    AND ae.created_at > NOW() - INTERVAL '30 days'
WHERE s.id IN (
    SELECT DISTINCT scenario_id
    FROM analytics_events
    WHERE scenario_id IS NOT NULL
    AND created_at > NOW() - INTERVAL '30 days'
)
GROUP BY s.id, s.title, s.display_name, c.name
HAVING COUNT(DISTINCT ae.session_id) FILTER (WHERE ae.event_type = 'scenario_view') > 0
ORDER BY unique_views DESC
LIMIT 10;

-- Vue pour les heures de pointe (avec SECURITY INVOKER)
CREATE OR REPLACE VIEW analytics_peak_hours
WITH (security_invoker = true)
AS
SELECT
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
HAVING COUNT(*) > 0
ORDER BY event_count DESC
LIMIT 24;

-- 3. Accorder les permissions sur les vues
GRANT SELECT ON analytics_realtime TO authenticated;
GRANT SELECT ON analytics_by_theme TO authenticated;
GRANT SELECT ON analytics_top_scenarios TO authenticated;
GRANT SELECT ON analytics_peak_hours TO authenticated;

-- 4. Ajouter des commentaires pour documentation
COMMENT ON VIEW analytics_realtime IS
'Vue temps réel (24h) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

COMMENT ON VIEW analytics_by_theme IS
'Statistiques par thème (30 jours) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

COMMENT ON VIEW analytics_top_scenarios IS
'Top 10 scénarios populaires (30 jours) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

COMMENT ON VIEW analytics_peak_hours IS
'Heures de pointe (7 jours) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Après avoir exécuté ce script:
-- 1. L'alerte de sécurité Supabase devrait disparaître
-- 2. Les vues respecteront désormais les politiques RLS
-- 3. Seuls les admins authentifiés pourront voir les données analytics
-- ============================================================================
