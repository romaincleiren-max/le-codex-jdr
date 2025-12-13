-- ============================================================================
-- FIX PERMISSIONS SUBMISSIONS - Correction des politiques RLS
-- ============================================================================
-- Ce script corrige les permissions pour permettre aux admins de voir les soumissions

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Anyone can submit scenarios" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON public.submissions;

-- Politique : Tout le monde peut insérer (soumettre)
CREATE POLICY "Public can submit scenarios"
    ON public.submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Politique : Tout le monde peut lire (pour l'onglet admin)
-- Note: L'authentification est gérée par l'app, pas par Supabase RLS dans ce cas
CREATE POLICY "Public can view submissions"
    ON public.submissions
    FOR SELECT
    TO public
    USING (true);

-- Politique : Tout le monde peut mettre à jour (l'app gère l'auth)
CREATE POLICY "Public can update submissions"
    ON public.submissions
    FOR UPDATE
    TO public
    USING (true);

-- Politique : Tout le monde peut supprimer (l'app gère l'auth)
CREATE POLICY "Public can delete submissions"
    ON public.submissions
    FOR DELETE
    TO public
    USING (true);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS mises à jour !';
    RAISE NOTICE 'Les admins peuvent maintenant accéder aux soumissions';
END $$;
