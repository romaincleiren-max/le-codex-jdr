-- ============================================================================
-- CORRECTION DES POLITIQUES RLS POUR LES ANALYTICS
-- Les vues d'analytics ne sont pas accessibles aux admins
-- ============================================================================

-- 1. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Only admins can read analytics" ON analytics_events;
DROP POLICY IF EXISTS "Only admins can read daily stats" ON analytics_daily_stats;

-- 2. Recréer les politiques avec une meilleure gestion

-- Politique : Tout le monde peut insérer des événements (tracking public)
CREATE POLICY "Public can insert analytics events"
ON analytics_events FOR INSERT
WITH CHECK (true);

-- Politique : Les admins authentifiés peuvent lire tous les événements
CREATE POLICY "Admins can read all analytics"
ON analytics_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Politique : Les stats quotidiennes sont lisibles par les admins
CREATE POLICY "Admins can read daily stats"
ON analytics_daily_stats FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- 3. Accorder les permissions sur les vues aux utilisateurs authentifiés
GRANT SELECT ON analytics_realtime TO authenticated;
GRANT SELECT ON analytics_by_theme TO authenticated;
GRANT SELECT ON analytics_top_scenarios TO authenticated;
GRANT SELECT ON analytics_peak_hours TO authenticated;

-- 4. Recréer les vues pour s'assurer qu'elles fonctionnent correctement
-- Vue pour les statistiques en temps réel (dernières 24h)
CREATE OR REPLACE VIEW analytics_realtime AS
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

-- Vue pour les statistiques par thème (avec protection contre NULL)
CREATE OR REPLACE VIEW analytics_by_theme AS
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

-- Vue pour les scénarios les plus populaires (corrigée)
CREATE OR REPLACE VIEW analytics_top_scenarios AS
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

-- Vue pour les heures de pointe
CREATE OR REPLACE VIEW analytics_peak_hours AS
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

-- 5. Vérifier que la table analytics_events existe et est bien configurée
-- Si elle n'existe pas, la créer
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_category TEXT,
    event_label TEXT,
    event_value NUMERIC,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE SET NULL,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    session_id TEXT,
    user_agent TEXT,
    ip_address TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_scenario ON analytics_events(scenario_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign ON analytics_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- 6. S'assurer que RLS est activé
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- 7. Ajouter des commentaires pour documentation
COMMENT ON POLICY "Public can insert analytics events" ON analytics_events IS 
'Permet à tout visiteur (même non authentifié) de créer des événements analytics';

COMMENT ON POLICY "Admins can read all analytics" ON analytics_events IS 
'Seuls les administrateurs authentifiés peuvent consulter les données analytics';

-- 8. Vérification finale - Créer une fonction helper pour tester les permissions
CREATE OR REPLACE FUNCTION check_analytics_access()
RETURNS TABLE(
    has_insert_on_events BOOLEAN,
    has_select_on_events BOOLEAN,
    has_select_on_realtime BOOLEAN,
    is_admin BOOLEAN,
    current_user_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        has_table_privilege('analytics_events', 'INSERT') as has_insert_on_events,
        has_table_privilege('analytics_events', 'SELECT') as has_select_on_events,
        has_table_privilege('analytics_realtime', 'SELECT') as has_select_on_realtime,
        EXISTS(
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        ) as is_admin,
        (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder l'exécution de la fonction de test
GRANT EXECUTE ON FUNCTION check_analytics_access() TO authenticated;
GRANT EXECUTE ON FUNCTION check_analytics_access() TO anon;

-- ============================================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================================
-- 1. Exécutez ce script dans l'éditeur SQL de Supabase
-- 2. Vérifiez les permissions en exécutant : SELECT * FROM check_analytics_access();
-- 3. Testez l'insertion d'un événement de test
-- 4. Connectez-vous en tant qu'admin et vérifiez que vous pouvez lire les stats
-- ============================================================================
