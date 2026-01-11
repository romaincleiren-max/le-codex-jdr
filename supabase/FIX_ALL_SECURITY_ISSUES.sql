-- ============================================================================
-- CORRECTION COMPLÈTE DES PROBLÈMES DE SÉCURITÉ SUPABASE
-- ============================================================================
-- Ce script corrige tous les problèmes détectés par le Security Advisor:
-- 1. Fonctions sans search_path configuré
-- 2. Politiques RLS trop permissives (USING true)
-- 3. Vues avec SECURITY DEFINER
-- 4. Protection des mots de passe faibles
-- ============================================================================

-- ============================================================================
-- PARTIE 1: CORRIGER LES FONCTIONS (search_path nullable)
-- ============================================================================

-- 1.1 cleanup_old_analytics
DROP FUNCTION IF EXISTS cleanup_old_analytics();
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM analytics_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- 1.2 get_scenario_tags
DROP FUNCTION IF EXISTS get_scenario_tags(INTEGER);
CREATE OR REPLACE FUNCTION get_scenario_tags(p_scenario_id INTEGER)
RETURNS TABLE (
  tag_id INTEGER,
  tag_name VARCHAR(50),
  category VARCHAR(30),
  color VARCHAR(7)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.category,
    t.color
  FROM scenario_tags st
  JOIN tags t ON st.tag_id = t.id
  WHERE st.scenario_id = p_scenario_id
    AND t.is_active = true
  ORDER BY t.category, t.name;
END;
$$;

-- 1.3 set_scenario_tags
DROP FUNCTION IF EXISTS set_scenario_tags(INTEGER, INTEGER[]);
CREATE OR REPLACE FUNCTION set_scenario_tags(
  p_scenario_id INTEGER,
  p_tag_ids INTEGER[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Supprimer tous les tags existants du scénario
  DELETE FROM scenario_tags WHERE scenario_id = p_scenario_id;

  -- Ajouter les nouveaux tags
  IF array_length(p_tag_ids, 1) > 0 THEN
    INSERT INTO scenario_tags (scenario_id, tag_id)
    SELECT p_scenario_id, unnest(p_tag_ids);
  END IF;
END;
$$;

-- 1.4 migrate_text_tags_to_structured
DROP FUNCTION IF EXISTS migrate_text_tags_to_structured();
CREATE OR REPLACE FUNCTION migrate_text_tags_to_structured()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  scenario_record RECORD;
  tag_text TEXT;
  tag_record RECORD;
BEGIN
  -- Pour chaque scénario avec des tags textuels
  FOR scenario_record IN
    SELECT id, tags FROM scenarios WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    -- Pour chaque tag textuel
    FOREACH tag_text IN ARRAY scenario_record.tags
    LOOP
      -- Chercher si le tag existe déjà
      SELECT id INTO tag_record FROM tags WHERE LOWER(name) = LOWER(tag_text);

      -- Si le tag existe, l'associer au scénario
      IF FOUND THEN
        INSERT INTO scenario_tags (scenario_id, tag_id)
        VALUES (scenario_record.id, tag_record.id)
        ON CONFLICT (scenario_id, tag_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 1.5 check_analytics_access
DROP FUNCTION IF EXISTS check_analytics_access();
CREATE OR REPLACE FUNCTION check_analytics_access()
RETURNS TABLE(
    has_insert_on_events BOOLEAN,
    has_select_on_events BOOLEAN,
    has_select_on_realtime BOOLEAN,
    is_admin BOOLEAN,
    current_user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- 1.6 delete_test_tags_by_string
DROP FUNCTION IF EXISTS delete_test_tags_by_string();
CREATE OR REPLACE FUNCTION delete_test_tags_by_string()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM scenario_tags
  WHERE tag_id IN (
    SELECT id FROM tags WHERE name ILIKE '%test%'
  );

  DELETE FROM tags WHERE name ILIKE '%test%';
END;
$$;

-- 1.7 generate_download_token (avec scenario_id)
DROP FUNCTION IF EXISTS generate_download_token(INTEGER);
CREATE OR REPLACE FUNCTION generate_download_token(scenario_id_param INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_token TEXT;
BEGIN
  new_token := encode(gen_random_bytes(32), 'base64');

  INSERT INTO download_tokens (scenario_id, token, expires_at)
  VALUES (scenario_id_param, new_token, NOW() + INTERVAL '24 hours');

  RETURN new_token;
END;
$$;

-- 1.7b generate_download_token (sans paramètre - pour PDF sales)
DROP FUNCTION IF EXISTS generate_download_token();
CREATE OR REPLACE FUNCTION generate_download_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- 1.8 check_download_token
DROP FUNCTION IF EXISTS check_download_token(TEXT);
CREATE OR REPLACE FUNCTION check_download_token(token_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  scenario_id_result INTEGER;
BEGIN
  SELECT scenario_id INTO scenario_id_result
  FROM download_tokens
  WHERE token = token_param
    AND expires_at > NOW()
    AND used = false;

  IF scenario_id_result IS NOT NULL THEN
    UPDATE download_tokens
    SET used = true, used_at = NOW()
    WHERE token = token_param;
  END IF;

  RETURN scenario_id_result;
END;
$$;

-- 1.9 increment_download_count (pour scenarios)
DROP FUNCTION IF EXISTS increment_download_count(INTEGER);
CREATE OR REPLACE FUNCTION increment_download_count(scenario_id_param INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE scenarios
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = scenario_id_param;
END;
$$;

-- 1.9b increment_download_count (pour purchases avec UUID)
DROP FUNCTION IF EXISTS increment_download_count(UUID);
CREATE OR REPLACE FUNCTION increment_download_count(purchase_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE purchases
  SET
    download_count = download_count + 1,
    updated_at = NOW()
  WHERE id = purchase_id_input;

  RETURN FOUND;
END;
$$;

-- 1.10 handle_updated_at
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.11 update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- PARTIE 2: CORRIGER LES POLITIQUES RLS TROP PERMISSIVES
-- ============================================================================

-- 2.1 Corriger analytics_events - Politique INSERT
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Public can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Public and authenticated can insert analytics events" ON analytics_events;

-- Permettre l'insertion aux utilisateurs anonymes et authentifiés
CREATE POLICY "Public and authenticated can insert analytics events"
ON analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2.2 Corriger analytics_events - Politique SELECT
DROP POLICY IF EXISTS "Only admins can read analytics" ON analytics_events;
DROP POLICY IF EXISTS "Admins can read all analytics" ON analytics_events;
DROP POLICY IF EXISTS "Only admins can read analytics events" ON analytics_events;

CREATE POLICY "Only admins can read analytics events"
ON analytics_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- 2.3 Corriger order_items - Politique SELECT
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

CREATE POLICY "Users can view their own order items"
ON order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- 2.4 Corriger orders - Politique SELECT
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2.5 Corriger purchases - SELECT
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;

CREATE POLICY "Users can view their own purchases"
ON purchases FOR SELECT
TO authenticated
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2.6 Corriger purchases - INSERT
DROP POLICY IF EXISTS "Users can create their own purchases" ON purchases;

CREATE POLICY "Users can create their own purchases"
ON purchases FOR INSERT
TO authenticated
WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2.7 Corriger submissions - SELECT
DROP POLICY IF EXISTS "Anyone can view submissions" ON submissions;
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON submissions;

-- Restreindre aux utilisateurs authentifiés ou rendre public selon votre besoin
CREATE POLICY "Authenticated users can view submissions"
ON submissions FOR SELECT
TO authenticated
USING (true);

-- Si vous voulez que ce soit vraiment public (anon):
-- CREATE POLICY "Anyone can view submissions"
-- ON submissions FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- 2.8 Corriger submissions - INSERT
DROP POLICY IF EXISTS "Anyone can create submissions" ON submissions;
DROP POLICY IF EXISTS "Authenticated and anonymous can create submissions" ON submissions;

CREATE POLICY "Authenticated and anonymous can create submissions"
ON submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================================================
-- PARTIE 3: CORRIGER LES VUES (SECURITY DEFINER -> SECURITY INVOKER)
-- ============================================================================

-- 3.1 Supprimer les anciennes vues
DROP VIEW IF EXISTS analytics_by_theme CASCADE;
DROP VIEW IF EXISTS analytics_realtime CASCADE;
DROP VIEW IF EXISTS analytics_top_scenarios CASCADE;
DROP VIEW IF EXISTS analytics_peak_hours CASCADE;

-- 3.2 Recréer les vues avec SECURITY INVOKER

-- Vue analytics_realtime
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

-- Vue analytics_by_theme
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

-- Vue analytics_top_scenarios
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

-- Vue analytics_peak_hours
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

-- 3.3 Accorder les permissions sur les vues
GRANT SELECT ON analytics_realtime TO authenticated;
GRANT SELECT ON analytics_by_theme TO authenticated;
GRANT SELECT ON analytics_top_scenarios TO authenticated;
GRANT SELECT ON analytics_peak_hours TO authenticated;

-- ============================================================================
-- PARTIE 4: ACTIVER LA PROTECTION DES MOTS DE PASSE FAIBLES
-- ============================================================================

-- Cette partie nécessite une action dans le dashboard Supabase:
-- 1. Allez dans Authentication > Policies
-- 2. Activez "Leaked Password Protection"
--
-- Alternative via SQL (si disponible):
-- ALTER DATABASE postgres SET app.settings.auth.password_leak_check = 'on';

-- ============================================================================
-- PARTIE 5: COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION cleanup_old_analytics() IS
'Nettoie les événements analytics de plus de 90 jours - SECURITY DEFINER avec search_path sécurisé';

COMMENT ON FUNCTION get_scenario_tags(INTEGER) IS
'Retourne tous les tags actifs d''un scénario - SECURITY DEFINER avec search_path sécurisé';

COMMENT ON FUNCTION set_scenario_tags(INTEGER, INTEGER[]) IS
'Assigne des tags à un scénario - SECURITY DEFINER avec search_path sécurisé';

COMMENT ON VIEW analytics_realtime IS
'Vue temps réel (24h) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

COMMENT ON VIEW analytics_by_theme IS
'Statistiques par thème (30 jours) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

COMMENT ON VIEW analytics_top_scenarios IS
'Top 10 scénarios populaires (30 jours) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

COMMENT ON VIEW analytics_peak_hours IS
'Heures de pointe (7 jours) - SECURITY INVOKER: respecte les permissions RLS de l''utilisateur';

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que toutes les fonctions ont search_path configuré
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE
        WHEN p.proconfig IS NULL THEN '❌ search_path non configuré'
        ELSE '✅ search_path configuré: ' || array_to_string(p.proconfig, ', ')
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================================================
-- INSTRUCTIONS D'APPLICATION
-- ============================================================================
-- 1. Exécutez ce script complet dans l'éditeur SQL de Supabase
-- 2. Vérifiez que toutes les alertes de sécurité ont disparu
-- 3. Pour la protection des mots de passe faibles:
--    - Allez dans Authentication > Policies dans le dashboard
--    - Activez "Leaked Password Protection"
-- 4. Testez que les fonctionnalités fonctionnent toujours correctement
-- ============================================================================
