-- ============================================================================
-- CORRECTION : Permission denied for table users
-- ============================================================================

-- Le problème : Les politiques RLS essaient d'accéder à auth.users
-- Solution : Utiliser auth.jwt() pour obtenir l'email directement du JWT

-- ============================================================================
-- CAMPAGNES
-- ============================================================================

DROP POLICY IF EXISTS "Insertion campagnes par admins" ON campaigns;
DROP POLICY IF EXISTS "Modification campagnes par admins" ON campaigns;
DROP POLICY IF EXISTS "Suppression campagnes par admins" ON campaigns;

CREATE POLICY "Insertion campagnes par admins" ON campaigns FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Modification campagnes par admins" ON campaigns FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Suppression campagnes par admins" ON campaigns FOR DELETE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- SCÉNARIOS
-- ============================================================================

DROP POLICY IF EXISTS "Insertion scénarios par admins" ON scenarios;
DROP POLICY IF EXISTS "Modification scénarios par admins" ON scenarios;
DROP POLICY IF EXISTS "Suppression scénarios par admins" ON scenarios;

CREATE POLICY "Insertion scénarios par admins" ON scenarios FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Modification scénarios par admins" ON scenarios FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Suppression scénarios par admins" ON scenarios FOR DELETE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- THÈMES
-- ============================================================================

DROP POLICY IF EXISTS "Insertion thèmes par admins" ON themes;
DROP POLICY IF EXISTS "Modification thèmes par admins" ON themes;
DROP POLICY IF EXISTS "Suppression thèmes par admins" ON themes;

CREATE POLICY "Insertion thèmes par admins" ON themes FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Modification thèmes par admins" ON themes FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Suppression thèmes par admins" ON themes FOR DELETE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- PARAMÈTRES DU SITE
-- ============================================================================

DROP POLICY IF EXISTS "Modification paramètres par admins" ON site_settings;

CREATE POLICY "Modification paramètres par admins" ON site_settings FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- EXPLICATION
-- ============================================================================

/*
✅ CORRECTION APPLIQUÉE :

Au lieu de :
  SELECT email FROM auth.users WHERE id = auth.uid()  ❌ Permission denied

On utilise :
  auth.jwt()->>'email'  ✅ Accès direct depuis le JWT

Le JWT (JSON Web Token) contient déjà l'email de l'utilisateur connecté,
donc pas besoin d'interroger la table auth.users.

SÉCURITÉ :
✅ auth.jwt() est automatiquement géré par Supabase
✅ Ne peut pas être falsifié côté client
✅ Contient les informations de l'utilisateur authentifié
*/
