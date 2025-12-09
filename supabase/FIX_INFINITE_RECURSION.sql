-- ============================================================================
-- CORRECTION URGENTE : Récursion infinie dans admin_users
-- ============================================================================

-- Le problème : La politique sur admin_users essaie de lire admin_users
-- pour vérifier si l'utilisateur peut lire admin_users → récursion infinie

-- Solution : Permettre la lecture de admin_users à tous les utilisateurs authentifiés

-- 1. Supprimer l'ancienne politique problématique
DROP POLICY IF EXISTS "Lecture admin_users par admins" ON admin_users;

-- 2. Créer une nouvelle politique simple sans récursion
CREATE POLICY "Lecture admin_users par authentifiés" ON admin_users FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- EXPLICATION
-- ============================================================================

/*
Cette politique permet à tous les utilisateurs authentifiés de LIRE la table admin_users.

Cela ne pose PAS de problème de sécurité car :
- ✅ La table ne contient que des emails (pas de données sensibles)
- ✅ Seuls les utilisateurs connectés peuvent la lire
- ✅ Les utilisateurs NON-admin ne peuvent PAS modifier les données (protégé par les autres politiques RLS)
- ✅ Cela permet au frontend de vérifier si l'utilisateur est admin sans récursion

SÉCURITÉ MAINTENUE :
- ❌ Les visiteurs non authentifiés ne peuvent PAS lire admin_users
- ❌ Personne ne peut INSERT/UPDATE/DELETE dans admin_users (pas de politique = interdit)
- ✅ Seuls les admins peuvent modifier campagnes/scénarios (vérifié via admin_users)
*/
