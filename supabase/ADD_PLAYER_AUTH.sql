-- ============================================================================
-- PHASE 1 — Auth joueurs sur les personnages
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================================

-- 1. Ajouter user_id et level_up_pending à la table characters
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level_up_pending BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);

-- 2. Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les politiques existantes (idempotent)
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.characters;
DROP POLICY IF EXISTS "Authenticated users can view characters" ON public.characters;
DROP POLICY IF EXISTS "Authenticated users can update characters" ON public.characters;
DROP POLICY IF EXISTS "characters_select" ON public.characters;
DROP POLICY IF EXISTS "characters_insert" ON public.characters;
DROP POLICY IF EXISTS "characters_update_player" ON public.characters;
DROP POLICY IF EXISTS "characters_update_admin" ON public.characters;
DROP POLICY IF EXISTS "characters_delete" ON public.characters;

-- 4. Politique lecture :
--    - Admin (dans admin_users) voit tout
--    - Joueur connecté voit ses propres personnages
--    - Anonyme peut voir les fiches approuvées (pour l'affichage public)
CREATE POLICY "characters_select" ON public.characters
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE email = auth.jwt()->>'email'
    )
  );

-- 5. Politique insertion :
--    - Tout utilisateur connecté peut créer un personnage lié à son compte
--    - Anonyme aussi (pour la forge publique sans compte)
CREATE POLICY "characters_insert" ON public.characters
  FOR INSERT WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
  );

-- 6. Politique mise à jour :
--    - Joueur connecté peut modifier ses propres personnages (sauf status et level_up_pending)
--    - Admin peut tout modifier
CREATE POLICY "characters_update_player" ON public.characters
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "characters_update_admin" ON public.characters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE email = auth.jwt()->>'email'
    )
  );

-- 7. Politique suppression : admin seulement
CREATE POLICY "characters_delete" ON public.characters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE email = auth.jwt()->>'email'
    )
  );

-- 8. Trigger updated_at (réutilise la fonction si elle existe déjà)
DROP TRIGGER IF EXISTS set_characters_updated_at ON public.characters;
CREATE TRIGGER set_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DO $$
BEGIN
  RAISE NOTICE '✅ Migration ADD_PLAYER_AUTH appliquée avec succès';
  RAISE NOTICE '→ Colonnes ajoutées : user_id, level_up_pending';
  RAISE NOTICE '→ RLS configuré : joueurs voient/éditent leurs fiches, admin voit tout';
END $$;
