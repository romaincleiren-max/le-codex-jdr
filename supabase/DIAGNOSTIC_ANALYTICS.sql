-- ============================================================================
-- DIAGNOSTIC: Vérifier l'état des vues et permissions analytics
-- ============================================================================

-- 1. Vérifier si les vues existent
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE 'analytics%'
ORDER BY table_name;

-- 2. Vérifier les options des vues (SECURITY INVOKER vs SECURITY DEFINER)
SELECT
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
    AND viewname LIKE 'analytics%';

-- 3. Vérifier les permissions GRANT sur les vues
SELECT
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND table_name LIKE 'analytics%'
ORDER BY table_name, grantee;

-- 4. Vérifier les politiques RLS sur analytics_events
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'analytics_events';

-- 5. Vérifier les politiques RLS sur scenarios et campaigns
SELECT
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('scenarios', 'campaigns')
ORDER BY tablename, policyname;

-- 6. Vérifier si RLS est activé
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('analytics_events', 'scenarios', 'campaigns');

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- Exécutez ce script pour voir l'état actuel de la configuration.
-- Copiez les résultats et partagez-les pour diagnostic.
-- ============================================================================
