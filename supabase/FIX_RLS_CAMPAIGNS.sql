-- ============================================================================
-- CORRECTION DES POLITIQUES RLS POUR PERMETTRE LES MODIFICATIONS
-- ============================================================================

-- Supprimer les anciennes politiques restrictives si elles existent
DROP POLICY IF EXISTS "Modification des campagnes par admins uniquement" ON campaigns;
DROP POLICY IF EXISTS "Modification des scénarios par admins uniquement" ON scenarios;
DROP POLICY IF EXISTS "Modification des thèmes" ON themes;

-- ============================================================================
-- SOLUTION TEMPORAIRE : Autoriser toutes les opérations
-- (À restreindre aux admins authentifiés plus tard)
-- ============================================================================

-- Campagnes : autoriser toutes les opérations
CREATE POLICY "Autoriser insertion campagnes" ON campaigns FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Autoriser modification campagnes" ON campaigns FOR UPDATE 
  USING (true);

CREATE POLICY "Autoriser suppression campagnes" ON campaigns FOR DELETE 
  USING (true);

-- Scénarios : autoriser toutes les opérations
CREATE POLICY "Autoriser insertion scénarios" ON scenarios FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Autoriser modification scénarios" ON scenarios FOR UPDATE 
  USING (true);

CREATE POLICY "Autoriser suppression scénarios" ON scenarios FOR DELETE 
  USING (true);

-- Thèmes : autoriser toutes les opérations
CREATE POLICY "Autoriser insertion thèmes" ON themes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Autoriser modification thèmes" ON themes FOR UPDATE 
  USING (true);

CREATE POLICY "Autoriser suppression thèmes" ON themes FOR DELETE 
  USING (true);

-- Paramètres du site : autoriser toutes les opérations
CREATE POLICY "Autoriser modification paramètres" ON site_settings FOR UPDATE 
  USING (true);

-- ============================================================================
-- NOTES
-- ============================================================================

/*
⚠️ IMPORTANT : Cette solution permet à TOUT LE MONDE de modifier les données

Pour sécuriser en production, vous devrez :
1. Implémenter Supabase Auth
2. Créer une table admin_users
3. Restreindre les modifications aux admins authentifiés

Voir le fichier RLS_SECURISATION.sql pour les instructions complètes.
*/
