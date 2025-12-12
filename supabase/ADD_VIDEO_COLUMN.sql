-- ============================================================================
-- AJOUT DE LA COLONNE background_video_url AUX CAMPAGNES
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================================

-- Ajouter la colonne background_video_url à la table campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS background_video_url TEXT;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_campaigns_video ON campaigns(background_video_url) 
WHERE background_video_url IS NOT NULL;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name = 'background_video_url';
