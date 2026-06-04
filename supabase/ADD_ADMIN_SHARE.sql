-- ============================================================================
-- Partage de personnages avec l'Admin — Forge du Héros
-- À exécuter dans Supabase > SQL Editor
-- ============================================================================

-- 1. Ajouter la colonne shared_with_admin à characters
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS shared_with_admin BOOLEAN DEFAULT false;

-- 2. Mettre à jour la policy SELECT :
--    - Joueur voit ses propres personnages
--    - Admin voit UNIQUEMENT les personnages marqués shared_with_admin = true
--    - status = 'approved' reste pour l'affichage public du site
DO $$
BEGIN
  DROP POLICY IF EXISTS "characters_select" ON public.characters;

  CREATE POLICY "characters_select" ON public.characters
    FOR SELECT USING (
      auth.uid() = user_id
      OR status = 'approved'
      OR (
        shared_with_admin = true
        AND EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE email = auth.jwt() ->> 'email'
        )
      )
    );

  RAISE NOTICE '✅ Policy characters_select mise à jour — admin voit uniquement les persos partagés';
END $$;

-- 3. Vérifier que l'email admin est bien dans admin_users
INSERT INTO public.admin_users (email)
VALUES ('romain.cleiren@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 4. Autoriser les joueurs à mettre à jour shared_with_admin sur leurs persos
--    (déjà couvert par characters_update_player, pas de changement nécessaire)

DO $$
BEGIN
  RAISE NOTICE '✅ Migration ADD_ADMIN_SHARE appliquée';
  RAISE NOTICE '→ Colonne shared_with_admin ajoutée à characters';
  RAISE NOTICE '→ Policy SELECT : admin voit uniquement shared_with_admin = true';
  RAISE NOTICE '→ Joueurs contrôlent qui partage avec l''admin';
END $$;
