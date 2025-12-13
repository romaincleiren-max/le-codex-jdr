-- ============================================================================
-- TABLE SUBMISSIONS - Système de soumission de scénarios
-- ============================================================================
-- Cette table stocke les soumissions de scénarios par le public

-- Créer la table submissions si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    scenario_name TEXT NOT NULL,
    author TEXT NOT NULL,
    email TEXT NOT NULL,
    summary TEXT NOT NULL,
    pdf_filename TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer un index sur le statut pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- Créer un index sur created_at pour le tri
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- Activer Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut insérer (soumettre)
CREATE POLICY "Anyone can submit scenarios"
    ON public.submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Politique : Seuls les admins authentifiés peuvent lire
CREATE POLICY "Authenticated users can view submissions"
    ON public.submissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique : Seuls les admins authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update submissions"
    ON public.submissions
    FOR UPDATE
    TO authenticated
    USING (true);

-- Politique : Seuls les admins authentifiés peuvent supprimer
CREATE POLICY "Authenticated users can delete submissions"
    ON public.submissions
    FOR DELETE
    TO authenticated
    USING (true);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.submissions;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table submissions créée avec succès !';
    RAISE NOTICE 'Politiques RLS configurées';
    RAISE NOTICE 'N oubliez pas de créer le bucket "submissions" dans Storage';
END $$;
