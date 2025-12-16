-- ============================================================================
-- SCRIPT DE TEST - Insérer des données de démonstration pour les analytics
-- ============================================================================
-- Ce script insère des données factices pour tester le système d'analytics
-- Exécutez ce script APRÈS avoir exécuté FIX_ANALYTICS_RLS.sql
-- ============================================================================

-- 1. Créer des sessions de test
DO $$
DECLARE
    session1 TEXT := 'test_session_' || gen_random_uuid()::TEXT;
    session2 TEXT := 'test_session_' || gen_random_uuid()::TEXT;
    session3 TEXT := 'test_session_' || gen_random_uuid()::TEXT;
    scenario_id_1 INTEGER;
    scenario_id_2 INTEGER;
    campaign_id_1 INTEGER;
BEGIN
    -- Récupérer quelques IDs de scénarios et campagnes existants
    SELECT id INTO scenario_id_1 FROM scenarios LIMIT 1;
    SELECT id INTO scenario_id_2 FROM scenarios OFFSET 1 LIMIT 1;
    SELECT id INTO campaign_id_1 FROM campaigns LIMIT 1;

    -- Session 1 - Visite complète avec téléchargement
    INSERT INTO analytics_events (event_type, event_category, event_label, session_id, created_at) VALUES
        ('page_view', 'home', 'Page d''accueil', session1, NOW() - INTERVAL '2 hours'),
        ('page_view', 'medieval', 'Univers médiéval', session1, NOW() - INTERVAL '1 hour 50 minutes');
    
    IF scenario_id_1 IS NOT NULL THEN
        INSERT INTO analytics_events (event_type, event_category, event_label, scenario_id, campaign_id, session_id, created_at) VALUES
            ('scenario_view', 'medieval', 'Vue scénario', scenario_id_1, campaign_id_1, session1, NOW() - INTERVAL '1 hour 40 minutes'),
            ('download', 'scenario', 'Téléchargement scénario', scenario_id_1, campaign_id_1, session1, NOW() - INTERVAL '1 hour 30 minutes');
    END IF;

    -- Session 2 - Navigation sans conversion
    INSERT INTO analytics_events (event_type, event_category, event_label, session_id, created_at) VALUES
        ('page_view', 'home', 'Page d''accueil', session2, NOW() - INTERVAL '5 hours'),
        ('page_view', 'lovecraft', 'Univers Lovecraft', session2, NOW() - INTERVAL '4 hours 50 minutes');
    
    IF scenario_id_2 IS NOT NULL THEN
        INSERT INTO analytics_events (event_type, event_category, event_label, scenario_id, session_id, created_at) VALUES
            ('scenario_view', 'lovecraft', 'Vue scénario', scenario_id_2, session2, NOW() - INTERVAL '4 hours 40 minutes');
    END IF;

    -- Session 3 - Ajout au panier
    INSERT INTO analytics_events (event_type, event_category, event_label, session_id, created_at) VALUES
        ('page_view', 'home', 'Page d''accueil', session3, NOW() - INTERVAL '30 minutes'),
        ('page_view', 'scifi', 'Univers Sci-Fi', session3, NOW() - INTERVAL '25 minutes');
    
    IF scenario_id_1 IS NOT NULL THEN
        INSERT INTO analytics_events (event_type, event_category, event_label, event_value, scenario_id, campaign_id, session_id, created_at) VALUES
            ('scenario_view', 'scifi', 'Vue scénario', null, scenario_id_1, campaign_id_1, session3, NOW() - INTERVAL '20 minutes'),
            ('cart_add', 'scenario', 'Ajout panier', 4.99, scenario_id_1, campaign_id_1, session3, NOW() - INTERVAL '15 minutes');
    END IF;

    -- Événements supplémentaires pour les dernières 24h
    INSERT INTO analytics_events (event_type, event_category, event_label, session_id, created_at) VALUES
        ('page_view', 'home', 'Page d''accueil', 'session_test_1', NOW() - INTERVAL '3 hours'),
        ('page_view', 'home', 'Page d''accueil', 'session_test_2', NOW() - INTERVAL '6 hours'),
        ('page_view', 'medieval', 'Univers médiéval', 'session_test_3', NOW() - INTERVAL '8 hours'),
        ('page_view', 'lovecraft', 'Univers Lovecraft', 'session_test_4', NOW() - INTERVAL '12 hours'),
        ('page_view', 'scifi', 'Univers Sci-Fi', 'session_test_5', NOW() - INTERVAL '18 hours');

    RAISE NOTICE 'Données de test insérées avec succès!';
    RAISE NOTICE 'Session 1: %', session1;
    RAISE NOTICE 'Session 2: %', session2;
    RAISE NOTICE 'Session 3: %', session3;
END $$;

-- 2. Vérifier les données insérées
SELECT 
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;

-- 3. Tester les vues
SELECT '=== REALTIME STATS ===' as info;
SELECT * FROM analytics_realtime;

SELECT '=== STATS BY THEME ===' as info;
SELECT * FROM analytics_by_theme;

SELECT '=== PEAK HOURS ===' as info;
SELECT * FROM analytics_peak_hours LIMIT 5;

-- 4. Message de confirmation
SELECT '✅ Test terminé! Vérifiez les résultats ci-dessus.' as status;
