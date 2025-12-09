-- ============================================================================
-- CONFIGURATION AUTHENTIFICATION ADMIN SÉCURISÉE
-- ============================================================================

-- 1. Créer une table pour gérer les administrateurs autorisés
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir la liste des admins
CREATE POLICY "Lecture admin_users par admins" ON admin_users FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 2. Ajouter votre email admin
-- ⚠️ IMPORTANT : Remplacez par votre vrai email que vous utiliserez pour vous connecter
INSERT INTO admin_users (email) VALUES ('votre-email@exemple.com')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- POLITIQUES RLS SÉCURISÉES POUR LES CAMPAGNES
-- ============================================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Modification des campagnes par admins uniquement" ON campaigns;
DROP POLICY IF EXISTS "Autoriser insertion campagnes" ON campaigns;
DROP POLICY IF EXISTS "Autoriser modification campagnes" ON campaigns;
DROP POLICY IF EXISTS "Autoriser suppression campagnes" ON campaigns;

-- Créer les nouvelles politiques restreintes aux admins
CREATE POLICY "Insertion campagnes par admins" ON campaigns FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Modification campagnes par admins" ON campaigns FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Suppression campagnes par admins" ON campaigns FOR DELETE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR LES SCÉNARIOS
-- ============================================================================

DROP POLICY IF EXISTS "Modification des scénarios par admins uniquement" ON scenarios;
DROP POLICY IF EXISTS "Autoriser insertion scénarios" ON scenarios;
DROP POLICY IF EXISTS "Autoriser modification scénarios" ON scenarios;
DROP POLICY IF EXISTS "Autoriser suppression scénarios" ON scenarios;

CREATE POLICY "Insertion scénarios par admins" ON scenarios FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Modification scénarios par admins" ON scenarios FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Suppression scénarios par admins" ON scenarios FOR DELETE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR LES THÈMES
-- ============================================================================

DROP POLICY IF EXISTS "Modification des thèmes" ON themes;
DROP POLICY IF EXISTS "Autoriser insertion thèmes" ON themes;
DROP POLICY IF EXISTS "Autoriser modification thèmes" ON themes;
DROP POLICY IF EXISTS "Autoriser suppression thèmes" ON themes;

CREATE POLICY "Insertion thèmes par admins" ON themes FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Modification thèmes par admins" ON themes FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Suppression thèmes par admins" ON themes FOR DELETE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR LES PARAMÈTRES DU SITE
-- ============================================================================

DROP POLICY IF EXISTS "Autoriser modification paramètres" ON site_settings;

CREATE POLICY "Modification paramètres par admins" ON site_settings FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================

/*
APRÈS AVOIR EXÉCUTÉ CE SCRIPT :

1. Modifiez la ligne 26 pour mettre VOTRE email admin

2. Dans Supabase Dashboard, allez dans :
   Authentication → Users → Add user
   
3. Créez votre compte admin avec :
   - Email : le même que celui dans admin_users
   - Password : votre mot de passe sécurisé
   - Email confirmation : Décochez "Send confirmation email" pour activer immédiatement

4. Ensuite, modifiez le code frontend (LoginPage.jsx) pour utiliser Supabase Auth

SÉCURITÉ :
✅ Seuls les utilisateurs authentifiés ET présents dans admin_users peuvent modifier
✅ Lecture publique pour tous (visiteurs du site)
✅ Logs d'authentification dans Supabase
✅ Gestion native des sessions
*/
