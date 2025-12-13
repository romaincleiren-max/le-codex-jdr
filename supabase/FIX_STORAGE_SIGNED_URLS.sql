-- ============================================================================
-- FIX STORAGE - Permissions pour URLs signées
-- ============================================================================
-- Ce script ajoute les permissions nécessaires pour créer des URLs signées

-- Supprimer les anciennes politiques du bucket submissions
DELETE FROM storage.policies WHERE bucket_id = 'submissions';

-- Politique 1: Permettre l'upload public (INSERT)
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
  'Public can upload submissions',
  'submissions',
  '(bucket_id = ''submissions''::text)',
  'true'::text
);

-- Politique 2: Permettre la lecture via URLs signées (SELECT avec auth)
-- Note: Les URLs signées nécessitent que l'utilisateur puisse "voir" le fichier
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
  'Authenticated users can access submissions',
  'submissions',
  '(bucket_id = ''submissions''::text)',
  'true'::text
);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Politiques Storage mises à jour !';
    RAISE NOTICE 'Les URLs signées devraient maintenant fonctionner';
END $$;
