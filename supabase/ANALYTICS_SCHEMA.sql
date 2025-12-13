-- ============================================================================
-- SYSTÈME DE STATISTIQUES / ANALYTICS
-- Tracking des événements et génération de statistiques réelles
-- ============================================================================

-- Table pour stocker tous les événements
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'page_view', 'scenario_view', 'download', 'cart_add', 'purchase'
    event_category TEXT, -- 'home', 'medieval', 'lovecraft', 'scifi', 'admin', etc.
    event_label TEXT, -- Nom du scénario/campagne, etc.
    event_value NUMERIC, -- Prix pour les achats, durée pour les sessions, etc.
    
    -- Métadonnées de l'événement
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE SET NULL,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Informations de session
    session_id TEXT, -- ID de session pour grouper les événements
    user_agent TEXT,
    ip_address TEXT,
    country TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_scenario ON analytics_events(scenario_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign ON analytics_events(campaign_id);

-- Table pour les statistiques agrégées (mise à jour quotidienne)
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
    id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    
    -- Statistiques générales
    total_visits INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    
    -- Par catégorie
    medieval_views INTEGER DEFAULT 0,
    lovecraft_views INTEGER DEFAULT 0,
    scifi_views INTEGER DEFAULT 0,
    
    -- Actions
    total_downloads INTEGER DEFAULT 0,
    total_cart_adds INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(stat_date)
);

-- Index pour les stats quotidiennes
CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_date ON analytics_daily_stats(stat_date);

-- Vue pour les statistiques en temps réel (dernières 24h)
CREATE OR REPLACE VIEW analytics_realtime AS
SELECT 
    COUNT(*) FILTER (WHERE event_type = 'page_view') as total_visits,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) FILTER (WHERE event_type = 'scenario_view') as scenario_views,
    COUNT(*) FILTER (WHERE event_type = 'download') as total_downloads,
    COUNT(*) FILTER (WHERE event_type = 'cart_add') as cart_adds,
    COUNT(*) FILTER (WHERE event_type = 'purchase') as purchases,
    SUM(event_value) FILTER (WHERE event_type = 'purchase') as revenue
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Vue pour les statistiques par thème
CREATE OR REPLACE VIEW analytics_by_theme AS
SELECT 
    event_category as theme,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_visitors
FROM analytics_events
WHERE event_type IN ('page_view', 'scenario_view')
    AND event_category IN ('medieval', 'lovecraft', 'scifi')
    AND created_at > NOW() - INTERVAL '30 days'
GROUP BY event_category;

-- Vue pour les scénarios les plus populaires
CREATE OR REPLACE VIEW analytics_top_scenarios AS
SELECT 
    s.id,
    s.title,
    s.display_name,
    c.name as campaign_name,
    COUNT(DISTINCT ae.session_id) as unique_views,
    COUNT(*) FILTER (WHERE ae.event_type = 'download') as downloads,
    COUNT(*) FILTER (WHERE ae.event_type = 'cart_add') as cart_adds
FROM scenarios s
LEFT JOIN campaigns c ON s.campaign_id = c.id
LEFT JOIN analytics_events ae ON ae.scenario_id = s.id
WHERE ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY s.id, s.title, s.display_name, c.name
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
ORDER BY event_count DESC;

-- Fonction pour nettoyer les anciennes données (garder 90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) - Lecture publique, écriture publique
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut insérer des événements (tracking)
CREATE POLICY "Anyone can insert analytics events"
ON analytics_events FOR INSERT
TO public
WITH CHECK (true);

-- Politique : Seuls les admins peuvent lire les statistiques
CREATE POLICY "Only admins can read analytics"
ON analytics_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.email = auth.jwt() ->> 'email'
    )
);

-- Pour les stats quotidiennes
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read daily stats"
ON analytics_daily_stats FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.email = auth.jwt() ->> 'email'
    )
);

-- Commentaires
COMMENT ON TABLE analytics_events IS 'Stocke tous les événements de tracking pour les analytics';
COMMENT ON TABLE analytics_daily_stats IS 'Statistiques quotidiennes agrégées pour performance';
COMMENT ON VIEW analytics_realtime IS 'Vue temps réel des dernières 24h';
COMMENT ON VIEW analytics_by_theme IS 'Statistiques par thème (30 derniers jours)';
COMMENT ON VIEW analytics_top_scenarios IS 'Top 10 des scénarios les plus populaires';
COMMENT ON VIEW analytics_peak_hours IS 'Heures de pointe de la semaine';
